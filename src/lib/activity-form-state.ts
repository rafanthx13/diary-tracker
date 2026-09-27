export type ActivityFormState = {
  status: "idle" | "success" | "error";
  message: string;
};

export const initialActivityFormState: ActivityFormState = {
  status: "idle",
  message: "",
};
