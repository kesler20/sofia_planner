import { IoIosArrowForward } from "react-icons/io";
import MainButton from "../button/MainButton";

export function SectionTitle(props: { title: string }) {
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
  }[];
  body?: React.ReactNode;
  onSubmit: (resource: any) => void;
  longer?: boolean;
}) {
  return (
    <div
      className={`
    flex items-center justify-center
    min-w-[250px] md:min-w-[280px] max-h-[550px] h-auto
    border-0.1 border-gray-200 relative
    bg-white
    rounded-2xl shadow-xl`}
    >
      <SVGBackground />
      <form className="flex items-center justify-center flex-col h-full">
        {/* Get Card Name */}
        <div className="hidden-scrollbar overflow-y-scroll h-[150px] pb-8" style={{
          height: props.longer ? "250px" : "150px",
        }}>
          {props.sections.map((section, index) => {
            return (
              <div className="mt-14" key={index}>
                <SectionTitle title={`${section.name} ?`} />
                <input
                  className={`
              text-center
              bg-transparent
              text-black
              ml-2`}
                  style={{
                    border: "none",
                    outline: "none",
                    borderBottom: "1px solid rgb(193, 197, 204)",
                  }}
                  title="write-topic"
                  type={typeof section.value === "string" ? "text" : "number"}
                  placeholder={`Enter ${section.name}`}
                  required
                  onChange={section.onChange}
                />
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
