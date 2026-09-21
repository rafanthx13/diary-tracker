export type ClassificationFormState = {
  status: "idle" | "success" | "error";
  message: string;
};

export const initialClassificationFormState: ClassificationFormState = {
  status: "idle",
  message: "",
};
