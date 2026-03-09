import { MouseEventHandler } from "react";
import { FaArrowUpRightFromSquare } from "react-icons/fa6";

export default function MainButton(props: {
  onSubmit: MouseEventHandler<HTMLButtonElement> | undefined;
  text?: string;
}) {
  return (
    <button className="modal__card__btn--create mb-8" onClick={props.onSubmit}>
      <p className="mr-2">{props.text ? props.text : "Submit"}</p>
      <FaArrowUpRightFromSquare size={"13"} />
    </button>
  );
}
