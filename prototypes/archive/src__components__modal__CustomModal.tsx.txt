import CustomForm from "../forms/CustomForm";
import BasicModal from "./BasicModal";


export default function CustomModal(props: {
  open: boolean;
  handleClose: () => void;
  sections: {
    name: string;
    value: string | number;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  }[];
  body?: React.ReactNode;
  onSubmit: (resource: any) => void;
}) {
  return (
    <BasicModal
      open={props.open}
      customModal={<CustomForm
        sections={props.sections}
        body={props.body}
        onSubmit={props.onSubmit}
      />}
      handleClose={props.handleClose}
    />
  )
}