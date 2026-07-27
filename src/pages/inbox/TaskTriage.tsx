import * as React from "react";
import {
  ArrowLeft,
  ArrowRight,
  CalendarClock,
  Check,
  Clock,
  Trash2,
  Undo2,
} from "lucide-react";
import { readResourceInDb, createResourceInDb } from "../../utils";

// ====================== //
//                        //
//   TYPES                //
//                        //
// ====================== //

// Mirrors automation_engine InboxProcessingUseCase.TaskStatus / TaskProcessing.
enum TaskStatus {
  PENDING = "PENDING",
  DONE = "DONE",
  TODAY = "TODAY",
  POSTPONE = "POSTPONE",
  DELETE = "DELETE",
  SKIP = "SKIP",
}

type Task = {
  id: string;
  projectId: string;
  list: string;
  title: string;
  dueDate: string | null;
  status: TaskStatus;
};

type SpeechRecognitionAlternative = { transcript: string };
type SpeechRecognitionResult = {
  length: number;
  [index: number]: SpeechRecognitionAlternative | undefined;
};
type SpeechRecognitionEvent = Event & { results: SpeechRecognitionResult[] };
type SpeechRecognitionErrorEvent = Event & { error: string };

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

const RESOURCE_NAME = "voice_task_reader_tasks";

// ====================== //
//                        //
//   MAIN COMPONENT       //
//                        //
// ====================== //

export default function TaskTriage() {
  const userEmail = localStorage.getItem("global/email") || "guest";

  const [tasks, setTasks] = React.useState<Task[]>([]);
  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const [currentIndex, setCurrentIndex] = React.useState<number>(0);
  const [lastVoiceCommand, setLastVoiceCommand] = React.useState<string>("nothing");
  const [isVoiceReady, setIsVoiceReady] = React.useState<boolean>(false);

  const recognitionRef = React.useRef<SpeechRecognition | null>(null);
  // Keep a ref of the latest tasks/index so voice callbacks read current state.
  const tasksRef = React.useRef<Task[]>([]);
  const indexRef = React.useRef<number>(0);
  tasksRef.current = tasks;
  indexRef.current = currentIndex;

  // ====================== //
  //                        //
  //   OBSERVE STATE        //
  //                        //
  // ====================== //

  console.log("tasks", tasks);
  console.log("currentIndex", currentIndex);
  console.log("lastVoiceCommand", lastVoiceCommand);
  console.log("isVoiceReady", isVoiceReady);

  // ====================== //
  //                        //
  //   SIDE EFFECTS         //
  //                        //
  // ====================== //

  React.useEffect(() => {
    readResourceInDb<string>(userEmail, RESOURCE_NAME).then(({ result, error }) => {
      if (error) {
        console.error("Error loading tasks:", error);
        setIsLoading(false);
        return;
      }
      if (result) {
        const parsed = JSON.parse(result) as Task[];
        setTasks(parsed);
      }
      setIsLoading(false);
    });
  }, []);

  React.useEffect(() => {
    const SpeechRecognitionCtor =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionCtor) {
      console.log("SpeechRecognition API not available in this browser.");
      return;
    }
    const recognition = new SpeechRecognitionCtor();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.continuous = true;
    recognitionRef.current = recognition;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const lastResult = event.results[event.results.length - 1];
      if (!lastResult || !lastResult[0]) return;
      const transcript = lastResult[0].transcript.trim().toLowerCase();
      setLastVoiceCommand(transcript);
      handleEventVoiceCommand(transcript);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.log("Voice control error", event.error);
    };

    recognition.onend = () => {
      if (recognitionRef.current) recognitionRef.current.start();
    };

    recognition.start();
    setIsVoiceReady(true);

    return () => {
      recognition.onend = null;
      recognition.stop();
    };
  }, []);

  // ====================== //
  //                        //
  //   UI EVENT HANDLERS    //
  //                        //
  // ====================== //

  // ------------------------------------------------------ Task
  const handleEventPersistStatus = async (
    taskId: string,
    newStatus: TaskStatus
  ) => {
    const { result, error } = await readResourceInDb<string>(userEmail, RESOURCE_NAME);
    if (error || !result) {
      console.error("Error reading tasks from database:", error);
      return;
    }
    const parsed = JSON.parse(result) as Task[];
    const updated = parsed.map((task) =>
      task.id !== taskId ? task : { ...task, status: newStatus },
    );
    const { error: writeError } = await createResourceInDb(
      userEmail,
      RESOURCE_NAME,
      JSON.stringify(updated),
    );
    if (writeError) {
      console.error("Error writing tasks to database:", writeError);
    }
  };

  const handleEventMarkCurrent = (status: TaskStatus) => {
    const list = tasksRef.current;
    const index = indexRef.current;
    const current = list[index];
    if (!current) return;

    setTasks((prev) =>
      prev.map((task) => (task.id !== current.id ? task : { ...task, status })),
    );
    handleEventPersistStatus(current.id, status);
    handleEventNext();
  };

  const handleEventNext = () => {
    setCurrentIndex((prev) => Math.min(tasksRef.current.length - 1, prev + 1));
  };

  const handleEventBack = () => {
    setCurrentIndex((prev) => Math.max(0, prev - 1));
  };

  const handleEventVoiceCommand = (command: string) => {
    const keyword = command.split(" ")[0];
    switch (keyword) {
      case "done":
        handleEventMarkCurrent(TaskStatus.DONE);
        break;
      case "today":
        handleEventMarkCurrent(TaskStatus.TODAY);
        break;
      case "postpone":
        handleEventMarkCurrent(TaskStatus.POSTPONE);
        break;
      case "delete":
        handleEventMarkCurrent(TaskStatus.DELETE);
        break;
      case "skip":
        handleEventMarkCurrent(TaskStatus.SKIP);
        break;
      case "back":
        handleEventBack();
        break;
      case "next":
        handleEventNext();
        break;
      default:
        break;
    }
  };

  // ====================== //
  //                        //
  //   UTILS METHODS        //
  //                        //
  // ====================== //

  const canGoBack = () => currentIndex > 0;

  const canGoNext = () => currentIndex < tasks.length - 1;

  const isCurrentStatus = (status: TaskStatus) => currentTask?.status === status;

  // ====================== //
  //                        //
  //   UI COMPONENTS        //
  //                        //
  // ====================== //

  if (isLoading) {
    return (
      <div className="h-[80vh] bg-white flex items-center justify-center">
        <p className="text-slate-600">Loading tasks...</p>
      </div>
    );
  }

  const currentTask = tasks[currentIndex] || null;

  return (
    <div className="h-[80vh] bg-white flex flex-col items-center justify-center p-8">
      <div className="w-full max-w-2xl flex flex-col items-center">
        {/* Task Info */}
        {currentTask ? (
          <div className="text-center mb-8 max-w-md px-2 sm:px-4">
            <p className="text-xs text-sky-500 mb-1">{currentTask.list}</p>
            <h2 className="text-xl font-semibold text-slate-800 mb-2">
              {currentTask.title}
            </h2>
            {currentTask.dueDate && (
              <p className="text-sm text-slate-600 mb-2">
                Due: {currentTask.dueDate.split("T")[0]}
              </p>
            )}
            <p className="text-xs text-slate-400 mb-4">Status: {currentTask.status}</p>
            <p className="text-xs text-slate-500">
              Task {currentIndex + 1} of {tasks.length}
            </p>
          </div>
        ) : (
          <div className="text-center mb-8 max-w-md">
            <p className="text-slate-500">No tasks to triage</p>
          </div>
        )}

        {/* Listening Circle */}
        <div className="mb-16 flex w-full items-center justify-center">
          <div
            className={`w-48 h-48 rounded-full bg-sky-300 flex items-center justify-center ${
              isVoiceReady ? "animate-pulse" : ""
            }`}
          >
            <div className="w-32 h-32 rounded-full bg-sky-200"></div>
          </div>
        </div>

        {/* Control Buttons */}
        <div className="flex items-center justify-center gap-2 sm:gap-6 w-full px-2">
          <button
            title="back"
            type="button"
            onClick={handleEventBack}
            disabled={!canGoBack()}
            className="w-10 h-10 sm:w-14 sm:h-14 rounded-full bg-white border-2 border-slate-200 flex items-center justify-center hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6 text-sky-400" />
          </button>

          <button
            title="done"
            type="button"
            onClick={() => handleEventMarkCurrent(TaskStatus.DONE)}
            disabled={!currentTask}
            className={
              isCurrentStatus(TaskStatus.DONE)
                ? "w-10 h-10 sm:w-14 sm:h-14 rounded-full border-2 flex items-center justify-center hover:bg-slate-50 transition-all border-sky-400 bg-sky-50 disabled:opacity-30 disabled:cursor-not-allowed"
                : "w-10 h-10 sm:w-14 sm:h-14 rounded-full bg-white border-2 flex items-center justify-center hover:bg-slate-50 transition-all border-slate-200 disabled:opacity-30 disabled:cursor-not-allowed"
            }
          >
            <Check className="w-5 h-5 sm:w-6 sm:h-6 text-sky-400" />
          </button>

          <button
            title="today"
            type="button"
            onClick={() => handleEventMarkCurrent(TaskStatus.TODAY)}
            disabled={!currentTask}
            className={
              isCurrentStatus(TaskStatus.TODAY)
                ? "w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-sky-500 flex items-center justify-center hover:bg-sky-500 transition-all shadow-lg disabled:opacity-30 disabled:cursor-not-allowed"
                : "w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-sky-400 flex items-center justify-center hover:bg-sky-500 transition-all shadow-lg disabled:opacity-30 disabled:cursor-not-allowed"
            }
          >
            <CalendarClock className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
          </button>

          <button
            title="postpone"
            type="button"
            onClick={() => handleEventMarkCurrent(TaskStatus.POSTPONE)}
            disabled={!currentTask}
            className={
              isCurrentStatus(TaskStatus.POSTPONE)
                ? "w-10 h-10 sm:w-14 sm:h-14 rounded-full border-2 flex items-center justify-center hover:bg-slate-50 transition-all border-sky-400 bg-sky-50 disabled:opacity-30 disabled:cursor-not-allowed"
                : "w-10 h-10 sm:w-14 sm:h-14 rounded-full bg-white border-2 flex items-center justify-center hover:bg-slate-50 transition-all border-slate-200 disabled:opacity-30 disabled:cursor-not-allowed"
            }
          >
            <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-sky-400" />
          </button>

          <button
            title="delete"
            type="button"
            onClick={() => handleEventMarkCurrent(TaskStatus.DELETE)}
            disabled={!currentTask}
            className={
              isCurrentStatus(TaskStatus.DELETE)
                ? "w-10 h-10 sm:w-14 sm:h-14 rounded-full border-2 flex items-center justify-center hover:bg-slate-50 transition-all border-sky-400 bg-sky-50 disabled:opacity-30 disabled:cursor-not-allowed"
                : "w-10 h-10 sm:w-14 sm:h-14 rounded-full bg-white border-2 flex items-center justify-center hover:bg-slate-50 transition-all border-slate-200 disabled:opacity-30 disabled:cursor-not-allowed"
            }
          >
            <Trash2 className="w-5 h-5 sm:w-6 sm:h-6 text-sky-400" />
          </button>

          <button
            title="skip"
            type="button"
            onClick={() => handleEventMarkCurrent(TaskStatus.SKIP)}
            disabled={!currentTask}
            className="w-10 h-10 sm:w-14 sm:h-14 rounded-full bg-white border-2 border-slate-200 flex items-center justify-center hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            <Undo2 className="w-5 h-5 sm:w-6 sm:h-6 text-sky-400" />
          </button>

          <button
            title="next"
            type="button"
            onClick={handleEventNext}
            disabled={!canGoNext()}
            className="w-10 h-10 sm:w-14 sm:h-14 rounded-full bg-white border-2 border-slate-200 flex items-center justify-center hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6 text-sky-400" />
          </button>
        </div>

        {/* Voice Command Status */}
        <div className="mt-8 text-center w-full max-w-sm px-4">
          <p className="text-xs text-slate-600 mb-1">What I heard: {lastVoiceCommand}</p>
          <p className="text-xs text-slate-500 leading-relaxed">
            Voice control {isVoiceReady ? "listening" : "unavailable"} (say: done, today,
            postpone, delete, skip, back, next)
          </p>
        </div>
      </div>
    </div>
  );
}
