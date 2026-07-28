import { IoIosArrowForward } from "react-icons/io";
import MainButton from "../button/MainButton";

export function SectionTitle(props: { centered?: boolean; title: string }) {
  if (props.centered) {
    return (
      <div className="relative flex h-[38px] w-full items-center text-gray-500">
        <div
          className={`
                absolute left-0
                flex justify-center items-center
                w-[38px] h-[38px]
                bg-gray-600
                rounded-full text-gray-200`}
        >
          <IoIosArrowForward size={20} />
        </div>
        <p className="w-full px-12 text-center">{props.title}</p>
      </div>
    );
  }

  return (
    <div className="flex w-full justify-start items-center text-gray-500">
      <div
        className={`
              flex justify-center items-center
              w-[38px] h-[38px]
              bg-gray-600
              rounded-full text-gray-200
              ml-2 mr-6`}
      >
        <IoIosArrowForward size={20} />
      </div>
      <p>{props.title}</p>
    </div>
  );
}

function SVGBackground() {
  return (
    <svg
      className="w-[100px] h-[100px] absolute top-[-7px] left-[-15px]"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="25" cy="25" r="5" fill="rgba(200, 200, 200,0.4)" />
      <circle cx="50" cy="25" r="10" fill="rgba(200, 200, 200,0.4)" />
      <circle cx="75" cy="25" r="15" fill="rgba(200, 200, 200,0.4)" />
      <circle cx="37.5" cy="50" r="7.5" fill="rgba(200, 200, 200,0.4)" />
      <circle cx="62.5" cy="50" r="12.5" fill="rgba(200, 200, 200,0.4)" />
      <circle cx="50" cy="75" r="10" fill="rgba(200, 200, 200,0.4)" />
    </svg>
  );
}

export default function CustomForm(props: {
  sections: {
    name: string;
    value: string | number;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    footer?: React.ReactNode;
    secondary?: {
      label: string;
      value: string | number;
      onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    };
  }[];
  header?: React.ReactNode;
  body?: React.ReactNode;
  onSubmit: (resource: any) => void;
  longer?: boolean;
  className?: string;
  fieldsClassName?: string;
}) {
  return (
    <div
      className={`
    flex items-center justify-center
    min-w-[250px] md:min-w-[280px] max-h-[550px] h-auto
    border-0.1 border-gray-200 relative
    bg-white
    rounded-2xl shadow-xl
    ${props.className ?? ""}`}
    >
      <SVGBackground />
      <form className="flex items-center justify-center flex-col h-full w-full">
        {/* Header content, e.g. a date selector */}
        {props.header}

        {/* Get Card Name */}
        <div className={`hidden-scrollbar overflow-y-scroll h-[150px] pb-8 ${props.fieldsClassName ?? ""}`} style={{
          height: props.longer ? "250px" : "150px",
        }}>
          {props.sections.map((section, index) => {
            return (
              <div className="mt-14" key={index}>
                <SectionTitle centered={Boolean(section.secondary)} title={`${section.name} ?`} />
                <div
                  className={
                    section.secondary
                      ? "grid w-full grid-cols-2 items-end justify-center gap-8 px-2"
                      : "flex w-full items-end justify-center px-2"
                  }
                >
                  <div className="flex min-w-0 flex-col items-center">
                    {section.secondary && (
                      <span className="text-[10px] text-gray-400 mb-1">Value</span>
                    )}
                    <input
                      className={`
                w-full min-w-0
                text-center
                bg-transparent
                text-black`}
                      style={{
                        border: "none",
                        outline: "none",
                        borderBottom: "1px solid rgb(193, 197, 204)",
                      }}
                      title="write-topic"
                      type={typeof section.value === "string" ? "text" : "number"}
                      placeholder={`Enter ${section.name}`}
                      required
                      value={section.value}
                      onChange={section.onChange}
                    />
                  </div>
                  {section.secondary && (
                    <div className="flex min-w-0 flex-col items-center">
                      <span className="text-[10px] text-gray-400 mb-1">
                        {section.secondary.label}
                      </span>
                      <input
                        className={`
                  w-full min-w-0
                  text-center
                  bg-transparent
                  text-black`}
                        style={{
                          border: "none",
                          outline: "none",
                          borderBottom: "1px solid rgb(193, 197, 204)",
                        }}
                        title="write-secondary"
                        type={
                          typeof section.secondary.value === "string"
                            ? "text"
                            : "number"
                        }
                        placeholder={section.secondary.label}
                        required
                        value={section.secondary.value}
                        onChange={section.secondary.onChange}
                      />
                    </div>
                  )}
                </div>
                {section.footer && (
                  <div className="mt-3 flex w-full justify-center px-2">
                    {section.footer}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Display the body of the modal */}
        {props.body}

        {/* Submit Button */}
        <MainButton
          onSubmit={(e) => {
            e.preventDefault();
            props.onSubmit(e);
          }}
        />
      </form>
    </div>
  );
}
