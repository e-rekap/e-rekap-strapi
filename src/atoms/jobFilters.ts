import { atom, selector, type AtomEffect } from "recoil";
import type { JobFilters } from "models/job";
import { buildJobsKey } from "services/jobService";

const STORAGE_KEY = "erekap/jobFilters";

// Effect: ambil filter dari localStorage waktu awal, terus simpan setiap kali berubah
const persistEffect: AtomEffect<JobFilters> = ({ setSelf, onSet }) => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) setSelf(JSON.parse(saved));
  } catch {}

  onSet((newValue, _old, isReset) => {
    try {
      if (isReset) localStorage.removeItem(STORAGE_KEY);
      else localStorage.setItem(STORAGE_KEY, JSON.stringify(newValue));
    } catch {}
  });
};

export const jobFiltersAtom = atom<JobFilters>({
  key: "erekap/jobFilters", // ⚠️ key wajib unik di seluruh app, makanya dikasih prefix modul
  default: { status: null, date: null },
  effects: [persistEffect],
});

// Selector 1: key SWR, diturunin dari filter
export const jobsKeySelector = selector<string>({
  key: "erekap/jobsKey",
  get: ({ get }) => buildJobsKey(get(jobFiltersAtom)),
});

// ✍️ Selector 2 (giliran kamu): ada berapa filter yang lagi aktif?
export const activeFilterCountSelector = selector<number>({
  key: "erekap/activeFilterCount",
  get: ({ get }) => {
    // TODO: ambil jobFiltersAtom, terus hitung berapa field yang nilainya BUKAN null (hasilnya 0, 1, atau 2)
    
    // const { status, date } = useRecoilValue(jobFiltersAtom);
    const { status, date } = get(jobFiltersAtom);
    
    if (status == null && date == null) {
      return 0;
    } else if (status == null || date == null) {
      return 1;
    }

    return 2;
  },
});
