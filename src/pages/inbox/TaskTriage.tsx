import * as React from "react";
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
  //   LOAD ON MOUNT        //
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

  // ====================== //
  //   PERSISTENCE          //
  // ====================== //

  const persistStatus = async (taskId: string, newStatus: TaskStatus) => {
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

  // ====================== //
  //   ACTIONS              //
  // ====================== //

  const markCurrent = (status: TaskStatus) => {
    const list = tasksRef.current;
    const index = indexRef.current;
    const current = list[index];
    if (!current) return;

    setTasks((prev) =>
      prev.map((task) => (task.id !== current.id ? task : { ...task, status })),
    );
    persistStatus(current.id, status);
    goNext();
  };

  const goNext = () => {
    setCurrentIndex((prev) => Math.min(tasksRef.current.length - 1, prev + 1));
  };

  const goBack = () => {
    setCurrentIndex((prev) => Math.max(0, prev - 1));
  };

  const handleVoiceCommand = (command: string) => {
    const keyword = command.split(" ")[0];
    switch (keyword) {
      case "done":
        markCurrent(TaskStatus.DONE);
        break;
      case "today":
        markCurrent(TaskStatus.TODAY);
        break;
      case "postpone":
        markCurrent(TaskStatus.POSTPONE);
        break;
      case "delete":
        markCurrent(TaskStatus.DELETE);
        break;
      case "skip":
        markCurrent(TaskStatus.SKIP);
        break;
      case "back":
        goBack();
        break;
      case "next":
        goNext();
        break;
      default:
        break;
    }
  };

  // ====================== //
  //   VOICE CONTROL        //
  // ====================== //

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
      handleVoiceCommand(transcript);
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
  //   UI                   //
  // ====================== //

  if (isLoading) {
    return (
      <div className="h-[80vh] bg-white flex items-center justify-center">
        <p className="text-slate-600">Loading tasks...</p>
      </div>
    );
  }

  const currentTask = tasks[currentIndex] || null;

  const actionButton = (label: string, status: TaskStatus, tone: string) => (
    <button
      type="button"
      onClick={() => markCurrent(status)}
      disabled={!currentTask}
      className={`px-4 py-2 rounded-full text-sm text-white ${tone} disabled:opacity-30 disabled:cursor-not-allowed`}
    >
      {label}
    </button>
  );

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-start px-4 py-8 sm:px-6 sm:py-10 md:px-12">
      <div className="w-full max-w-2xl flex flex-col items-center">
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

        <div className="flex w-full flex-wrap items-center justify-center gap-3 mb-6">
          {actionButton("Done", TaskStatus.DONE, "bg-emerald-500 hover:bg-emerald-600")}
          {actionButton("Today", TaskStatus.TODAY, "bg-sky-500 hover:bg-sky-600")}
          {actionButton("Postpone", TaskStatus.POSTPONE, "bg-amber-500 hover:bg-amber-600")}
          {actionButton("Delete", TaskStatus.DELETE, "bg-rose-500 hover:bg-rose-600")}
          {actionButton("Skip", TaskStatus.SKIP, "bg-slate-400 hover:bg-slate-500")}
        </div>

        <div className="flex w-full items-center justify-center gap-4">
          <button
            type="button"
            onClick={goBack}
            disabled={currentIndex === 0}
            className="px-4 py-2 rounded-full text-sm bg-white border-2 border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Back
          </button>
          <button
            type="button"
            onClick={goNext}
            disabled={currentIndex >= tasks.length - 1}
            className="px-4 py-2 rounded-full text-sm bg-white border-2 border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>

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
