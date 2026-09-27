import { useEffect, useState } from "react";

// custom hook, boleh manggil hook lain
// T itu kaya any
export function useFetch<T>(fetcher: (signal: AbortSignal) => Promise<T>) { // fetcher is a func
  const [data, setData] = useState<T | null>(null); // hasil dr api
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController(); // remot buat batalin request
    setLoading(true);
    fetcher(controller.signal) // jalanin fungsi fetcher, trus kasih sinyal pembatal. hasilnya Promise (janji data bakal dateng)
      .then(setData) // kalo data berhasil dateng
      .catch((err) => { // kalo data gagal dateng
        if (err.name !== "AbortError") setError(err);
      })
      .finally(() => setLoading(false)); // selalu jalan

    return () => controller.abort(); // komponen hilang (ex: user pindah halaman) → batalin request yang masih jalan
  }, [fetcher]); // jalan setelah render pertama dan setiap fetcher berubah

  return { data, error, loading };
}
