import { MouseEventHandler } from "react";
import { FaArrowUpRightFromSquare } from "react-icons/fa6";

export default function MainButton(props: {
  onSubmit: MouseEventHandler<HTMLButtonElement> | undefined;
  text?: string;
  className?: string;
  iconOnlyOnMobile?: boolean;
}) {
  const buttonText = props.text ? props.text : "Submit";

  return (
    <button
      title={buttonText}
      className={`modal__card__btn--create ${
        props.iconOnlyOnMobile ? "modal__card__btn--mobile-icon" : ""
      } mb-8 ${props.className ?? ""}`}
      onClick={props.onSubmit}
    >
      <p className={`${props.iconOnlyOnMobile ? "hidden sm:block" : ""} mr-2`}>
        {buttonText}
      </p>
      <FaArrowUpRightFromSquare size={"13"} />
    </button>
  );
}
