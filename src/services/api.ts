// satu2nya tempat ngobrol sama network

const BASE_URL = process.env.REACT_APP_API_URL;

// Fungsi dasar: bisa nerima opsi fetch, misalnya signal buat ngebatalin request
export async function apiRequest<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    // Content-Type cuma dipasang kalau ada body (POST/PUT)
    headers: {
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...(actorId ? { "x-dev-user": actorId } : {}), // "atas nama siapa" request ini
      ...init?.headers,
    },
  });

  const text = await res.text(); // body-nya bisa kosong, misalnya waktu DELETE
  const body = text ? JSON.parse(text) : undefined;

  // Strapi ngirim error dengan bentuk { error: { status, message } }. Ambil pesannya.
  if (!res.ok)
    throw new Error(body?.error?.message ?? `Request gagal: ${res.status}`);
  return body as T;
}

// services gak bisa pakai hook (bukan komponen), jadi identitasnya disimpan di variabel modul ini
let actorId: string | null = null;
export const setActorId = (id: string | null) => {
  actorId = id;
};

// export async function apiRequest<T>(
//   path: string,
//   init?: RequestInit,
// ): Promise<T> {
//   const res = await fetch(`${BASE_URL}${path}`, init);
//   if (!res.ok) throw new Error(`Request gagal: ${res.status}`);
//   return res.json();
// }

// Versi khusus SWR (dipakai di Lv3). Cuma nerima path.
export const apiFetcher = <T = unknown>(path: string) => apiRequest<T>(path);