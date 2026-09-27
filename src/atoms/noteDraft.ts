import { atomFamily } from "recoil";

// Satu "loker" draft catatan per job. Nomor lokernya = documentId job
export const noteDraftFamily = atomFamily<string, string>({
  key: "erekap/noteDraft",
  default: "",
});
