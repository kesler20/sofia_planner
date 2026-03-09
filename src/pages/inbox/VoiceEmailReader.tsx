import * as React from "react";
import { readResourceInDb, useCachedValue, createResourceInDb } from "../../utils";

// ====================== //
//                        //
//   TYPES                //
//                        //
// ====================== //

enum EmailStatus {
  PENDING = "PENDING",
  ARCHIVED = "ARCHIVED",
  FLAGGED = "FLAGGED",
  SKIPPED = "SKIPPED",
}

type Email = {
  account: string;
  id: string;
  subject: string;
  from_email: string;
  content: string;
  status: EmailStatus;
};

type PlayState = "idle" | "playing" | "paused";

type SpeechRecognitionAlternative = {
  transcript: string;
};

type SpeechRecognitionResult = {
  length: number;
  [index: number]: SpeechRecognitionAlternative | undefined;
};

type SpeechRecognitionEvent = Event & {
  results: SpeechRecognitionResult[];
};

type SpeechRecognitionErrorEvent = Event & {
  error: string;
};

interface SpeechRecognition {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

type SpeechRecognitionConstructor = new () => SpeechRecognition;

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

const batchSize = 6;

// ====================== //
//                        //
//   MAIN COMPONENT       //
//                        //
// ====================== //

export default function VoiceEmailReader() {
  // ====================== //
  //                        //
  //   STATE VARIABLES      //
  //                        //
  // ====================== //

  const userEmail = localStorage.getItem("global/email") || "guest";

  // Track how many emails have been processed/seen (persisted in local storage)
  const [processedEmailsCount, setProcessedEmailsCount] = useCachedValue<number>(
    userEmail,
    0,
    "voice_email_reader_processed_count",
  );

  // Current batch of emails (not persisted, loaded from full list in DB)
  const [emails, setEmails] = React.useState<Email[]>([]);
  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const [currentIndex, setCurrentIndex] = React.useState<number>(0);
  const [playState, setPlayState] = React.useState<PlayState>("idle");
  const [selectedAccount, setSelectedAccount] = React.useState<string | null>(null);
  const [isVoiceReady, setIsVoiceReady] = React.useState<boolean>(false);
  const [lastVoiceCommand, setLastVoiceCommand] = React.useState<string>("nothing");
  const [isRefreshing, setIsRefreshing] = React.useState<boolean>(false);

  const utteranceRef = React.useRef<SpeechSynthesisUtterance | null>(null);
  const recognitionRef = React.useRef<SpeechRecognition | null>(null);

  // ====================== //
  //                        //
  //   OBSERVE STATE        //
  //                        //
  // ====================== //

  console.log("emails", emails);
  console.log("currentIndex", currentIndex);
  console.log("playState", playState);
  console.log("selectedAccount", selectedAccount);
  console.log("isLoading", isLoading);
  console.log("isRefreshing", isRefreshing);
  console.log("processedEmailsCount", processedEmailsCount);

  // ====================== //
  //                        //
  //   SIDE EFFECTS         //
  //                        //
  // ====================== //

  // Load initial batch on mount
  React.useEffect(() => {
    readResourceInDb<string>(userEmail, "voice_email_reader_emails").then(
      ({ result, error }) => {
        if (error) {
          console.error("Error loading emails:", error);
          setIsLoading(false);
          return;
        }
        if (result) {
          const parsed = JSON.parse(result) as Email[];
          const initialBatch = parsed.slice(
            processedEmailsCount,
            processedEmailsCount + batchSize,
          );
          setEmails(initialBatch);
        }
        setIsLoading(false);
      },
    );
  }, []);

  React.useEffect(() => {
    return () => {
      if (utteranceRef.current) {
        window.speechSynthesis.cancel();
      }
      if (recognitionRef.current) {
        recognitionRef.current.onend = null;
        recognitionRef.current.stop();
      }
    };
  }, []);

  React.useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.log("SpeechRecognition API not available in this browser.");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.continuous = true;
    recognitionRef.current = recognition;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const lastResult = event.results[event.results.length - 1];
      if (!lastResult || !lastResult[0]) {
        return;
      }
      const transcript = lastResult[0].transcript.trim().toLowerCase();
      setLastVoiceCommand(transcript);
      handleEventVoiceCommand(transcript);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.log("Voice control error", event.error);
    };

    recognition.onend = () => {
      if (recognitionRef.current) {
        recognitionRef.current.start();
      }
    };

    recognition.start();
    setIsVoiceReady(true);

    return () => {
      recognition.onend = null;
      recognition.stop();
    };
  }, [currentIndex, emails.length]);

  React.useEffect(() => {
    const filtered = getFilteredEmails();
    if (currentIndex >= filtered.length && filtered.length > 0) {
      setCurrentIndex(filtered.length - 1);
    } else if (filtered.length === 0) {
      setCurrentIndex(0);
    }
  }, [selectedAccount, emails]);

  // ====================== //
  //                        //
  //   UI EVENT HANDLERS    //
  //                        //
  // ====================== //

  // ------------------------------------------------------ Playback
  const handleEventPlay = () => {
    const filtered = getFilteredEmails();
    if (filtered.length === 0) return;

    const currentEmail = filtered[currentIndex];
    const textToSpeak = `From ${currentEmail.from_email}. Subject: ${currentEmail.subject}. ${currentEmail.content}`;

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utteranceRef.current = utterance;

    utterance.onstart = () => {
      setPlayState("playing");
    };

    utterance.onend = () => {
      setPlayState("idle");
    };

    utterance.onerror = () => {
      setPlayState("idle");
    };

    window.speechSynthesis.speak(utterance);
  };

  const handleEventPause = () => {
    window.speechSynthesis.pause();
    setPlayState("paused");
  };

  const handleEventResume = () => {
    window.speechSynthesis.resume();
    setPlayState("playing");
  };

  // ------------------------------------------------------ Navigation
  const handleEventBack = () => {
    window.speechSynthesis.cancel();
    setPlayState("idle");
    setCurrentIndex((prev) => Math.max(0, prev - 1));
  };

  const handleEventSkip = () => {
    const filtered = getFilteredEmails();
    const currentEmail = filtered[currentIndex];

    if (currentEmail.status === EmailStatus.PENDING) {
      setEmails((prev) =>
        prev.map((email) =>
          email.id !== currentEmail.id
            ? email
            : { ...email, status: EmailStatus.SKIPPED },
        ),
      );

      // Persist to database
      updateEmailInDb(currentEmail.id, EmailStatus.SKIPPED);
    }

    window.speechSynthesis.cancel();
    setPlayState("idle");
    setCurrentIndex((prev) => Math.min(filtered.length - 1, prev + 1));
  };

  // ------------------------------------------------------ Email Actions
  const handleEventArchive = () => {
    const filtered = getFilteredEmails();
    if (filtered.length === 0) return;

    const currentEmail = filtered[currentIndex];
    const newStatus =
      currentEmail.status === EmailStatus.ARCHIVED
        ? EmailStatus.PENDING
        : EmailStatus.ARCHIVED;

    setEmails((prev) =>
      prev.map((email) =>
        email.id !== currentEmail.id ? email : { ...email, status: newStatus },
      ),
    );

    // Persist to database
    updateEmailInDb(currentEmail.id, newStatus);
  };

  const handleEventFlag = () => {
    const filtered = getFilteredEmails();
    if (filtered.length === 0) return;

    const currentEmail = filtered[currentIndex];
    const newStatus =
      currentEmail.status === EmailStatus.FLAGGED
        ? EmailStatus.PENDING
        : EmailStatus.FLAGGED;

    setEmails((prev) =>
      prev.map((email) =>
        email.id !== currentEmail.id ? email : { ...email, status: newStatus },
      ),
    );

    // Persist to database
    updateEmailInDb(currentEmail.id, newStatus);
  };

  // ------------------------------------------------------ Account Filter
  const handleEventRefreshEmails = async () => {
    setIsRefreshing(true);
    const { result, error } = await readResourceInDb<string>(
      userEmail,
      "voice_email_reader_emails",
    );

    if (error) {
      console.log("Error refreshing emails:", error);
      setIsRefreshing(false);
      return;
    }

    if (result) {
      const parsed = JSON.parse(result) as Email[];

      // Calculate new offset based on currently processed emails
      const newOffset = processedEmailsCount + emails.length;

      // Slice with offset, handling edge cases gracefully
      let newBatch: Email[];
      if (parsed.length === 0) {
        newBatch = [];
      } else if (newOffset >= parsed.length) {
        // If offset exceeds array length, return last `batchSize` items
        const startFromEnd = Math.max(0, parsed.length - batchSize);
        newBatch = parsed.slice(startFromEnd, parsed.length);
      } else {
        // Normal case: slice from offset with limit
        newBatch = parsed.slice(newOffset, newOffset + batchSize);
      }

      // Update processed count to include current batch
      setProcessedEmailsCount(newOffset);

      setEmails(newBatch);
      setCurrentIndex(0);
      window.speechSynthesis.cancel();
      setPlayState("idle");
    }

    setIsRefreshing(false);
  };

  const handleEventResetOffset = () => {
    setProcessedEmailsCount(0);
    window.location.reload();
  };

  const handleEventSelectAccount = (account: string | null) => {
    setSelectedAccount(account);
    setCurrentIndex(0);
    window.speechSynthesis.cancel();
    setPlayState("idle");
  };

  // Helper to update email status in database
  const updateEmailInDb = async (emailId: string, newStatus: EmailStatus) => {
    const { result, error } = await readResourceInDb<string>(
      userEmail,
      "voice_email_reader_emails",
    );

    if (error) {
      console.error("Error reading emails from database:", error);
      return;
    }

    if (result) {
      const parsed = JSON.parse(result) as Email[];
      const updated = parsed.map((email) =>
        email.id !== emailId ? email : { ...email, status: newStatus },
      );

      const { error: writeError } = await createResourceInDb(
        userEmail,
        "voice_email_reader_emails",
        JSON.stringify(updated),
      );

      if (writeError) {
        console.error("Error writing emails to database:", writeError);
      }
    }
  };

  // ====================== //
  //                        //
  //   UTILS METHODS        //
  //                        //
  // ====================== //

  const getUniqueAccounts = () => {
    const accounts = emails.map((email) => email.account);
    return [...new Set(accounts)];
  };

  const getFilteredEmails = () => {
    if (selectedAccount === null) {
      return emails;
    }
    return emails.filter((email) => email.account === selectedAccount);
  };

  const getCurrentEmail = () => {
    const filtered = getFilteredEmails();
    return filtered[currentIndex] || null;
  };

  const isArchived = () => {
    const currentEmail = getCurrentEmail();
    return currentEmail?.status === EmailStatus.ARCHIVED;
  };

  const isFlagged = () => {
    const currentEmail = getCurrentEmail();
    return currentEmail?.status === EmailStatus.FLAGGED;
  };

  const canGoBack = () => currentIndex > 0;

  const canSkip = () => {
    const filtered = getFilteredEmails();
    return currentIndex < filtered.length - 1;
  };

  const handleEventVoiceCommand = (command: string) => {
    console.log("voice command", command);
    const keyword = command.split(" ")[0];
    switch (keyword) {
      case "back":
        if (canGoBack()) handleEventBack();
        break;
      case "skip":
        if (canSkip()) handleEventSkip();
        break;
      case "next":
        if (canSkip()) handleEventSkip();
        break;
      case "flag":
        handleEventFlag();
        break;
      case "archive":
        handleEventArchive();
        break;
      case "play":
        handleEventPlay();
        break;
      case "stop":
        handleEventPause();
        break;
      default:
        break;
    }
  };

  // ====================== //
  //                        //
  //   UI COMPONENTS        //
  //                        //
  // ====================== //

  if (isLoading) {
    return (
      <div className="h-[80vh] bg-white flex items-center justify-center">
        <p className="text-slate-600">Loading emails...</p>
      </div>
    );
  }

  const filteredEmails = getFilteredEmails();
  const currentEmail = getCurrentEmail();
  const uniqueAccounts = getUniqueAccounts();

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-start px-4 py-8 sm:px-6 sm:py-10 md:px-12">
      <div className="w-full max-w-2xl flex flex-col items-center">
        {/* Account Toggle */}
        <div className="mb-8 flex w-full flex-wrap items-center justify-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => handleEventSelectAccount(null)}
            className={
              selectedAccount === null
                ? "px-3 py-1 rounded-full text-sm bg-sky-400 text-white"
                : "px-3 py-1 rounded-full text-sm bg-slate-100 text-slate-600 hover:bg-slate-200"
            }
          >
            All
          </button>
          {uniqueAccounts.map((account) => (
            <button
              key={account}
              type="button"
              onClick={() => handleEventSelectAccount(account)}
              className={
                selectedAccount === account
                  ? "px-3 py-1 rounded-full text-sm bg-sky-400 text-white"
                  : "px-3 py-1 rounded-full text-sm bg-slate-100 text-slate-600 hover:bg-slate-200"
              }
            >
              {account}
            </button>
          ))}

          <button
            type="button"
            onClick={handleEventRefreshEmails}
            disabled={isRefreshing}
            className="px-3 py-1 rounded-full text-sm bg-sky-400 text-white hover:bg-sky-500 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isRefreshing ? "Refreshing..." : "Next batch"}
          </button>

          <button
            type="button"
            onClick={handleEventResetOffset}
            className="px-3 py-1 rounded-full text-sm bg-slate-200 text-slate-600 hover:bg-slate-300"
          >
            Reset
          </button>
        </div>

        {/* Email Info */}
        {currentEmail ? (
          <div className="text-center mb-8 max-w-md px-2 sm:px-4">
            <p className="text-xs text-sky-500 mb-1">{currentEmail.account}</p>
            <h2 className="text-xl font-semibold text-slate-800 mb-2">
              {currentEmail.subject}
            </h2>
            <p className="text-sm text-slate-600 mb-2">
              From: {currentEmail.from_email}
            </p>
            <p className="text-xs text-slate-400 mb-4">
              Status: {currentEmail.status}
            </p>
            <p className="text-xs text-slate-500">
              Email {currentIndex + 1} of {filteredEmails.length}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              (Offset: {processedEmailsCount} processed)
            </p>
          </div>
        ) : (
          <div className="text-center mb-8 max-w-md">
            <p className="text-slate-500">No emails available</p>
          </div>
        )}

        {/* Pulsing Circle */}
        <div className="mb-12 md:mb-16 flex w-full items-center justify-center">
          <div
            className={`w-40 h-40 sm:w-48 sm:h-48 rounded-full bg-sky-300 flex items-center justify-center ${
              playState === "playing" ? "animate-pulse" : ""
            }`}
          >
            <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-sky-200"></div>
          </div>
        </div>

        {/* Control Buttons */}
        <div className="flex w-full flex-wrap items-center justify-center gap-4 sm:gap-5 md:gap-6">
          {/* Back Button */}
          <button
            title="back"
            type="button"
            onClick={handleEventBack}
            disabled={!canGoBack()}
            className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-white border-2 border-slate-200 flex items-center justify-center hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            <svg
              className="w-6 h-6 text-sky-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>

          {/* Archive Button */}
          <button
            title="archive"
            type="button"
            onClick={handleEventArchive}
            disabled={!currentEmail}
            className={
              isArchived()
                ? "w-12 h-12 md:w-14 md:h-14 rounded-full border-2 flex items-center justify-center hover:bg-slate-50 transition-all border-sky-400 bg-sky-50 disabled:opacity-30 disabled:cursor-not-allowed"
                : "w-12 h-12 md:w-14 md:h-14 rounded-full bg-white border-2 flex items-center justify-center hover:bg-slate-50 transition-all border-slate-200 disabled:opacity-30 disabled:cursor-not-allowed"
            }
          >
            <svg
              className="w-6 h-6 text-sky-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
              />
            </svg>
          </button>

          {/* Play/Pause/Replay Button */}
          <button
            title="play"
            type="button"
            onClick={() => {
              if (playState === "idle") {
                handleEventPlay();
              } else if (playState === "playing") {
                handleEventPause();
              } else {
                handleEventResume();
              }
            }}
            disabled={!currentEmail}
            className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-sky-400 flex items-center justify-center hover:bg-sky-500 transition-all shadow-lg disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {playState === "idle" && (
              <svg
                className="w-8 h-8 text-white ml-1"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
            {playState === "playing" && (
              <svg
                className="w-8 h-8 text-white"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
              </svg>
            )}
            {playState === "paused" && (
              <svg
                className="w-8 h-8 text-white ml-1"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>

          {/* Flag Button */}
          <button
            title="flag"
            type="button"
            onClick={handleEventFlag}
            disabled={!currentEmail}
            className={
              isFlagged()
                ? "w-12 h-12 md:w-14 md:h-14 rounded-full border-2 flex items-center justify-center hover:bg-slate-50 transition-all border-sky-400 bg-sky-50 disabled:opacity-30 disabled:cursor-not-allowed"
                : "w-12 h-12 md:w-14 md:h-14 rounded-full bg-white border-2 flex items-center justify-center hover:bg-slate-50 transition-all border-slate-200 disabled:opacity-30 disabled:cursor-not-allowed"
            }
          >
            <svg
              className="w-6 h-6 text-sky-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9"
              />
            </svg>
          </button>

          {/* Skip Button */}
          <button
            title="skip"
            type="button"
            onClick={handleEventSkip}
            disabled={!canSkip()}
            className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-white border-2 border-slate-200 flex items-center justify-center hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            <svg
              className="w-6 h-6 text-sky-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        </div>

        {/* Voice Command Status */}
        <div className="mt-8 text-center w-full max-w-sm px-4">
          <p className="text-xs text-slate-600 mb-1">
            What I heard: {lastVoiceCommand}
          </p>
          <p className="text-xs text-slate-500 leading-relaxed">
            Voice control {isVoiceReady ? "listening" : "unavailable"} (say: back,
            skip, flag, archive, play)
          </p>
        </div>
      </div>
    </div>
  );
}
