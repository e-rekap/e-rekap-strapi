// Siapa yang manggil API ini? Sementara diambil dari header dev.
// Nanti isi fungsi INI AJA yang diganti buat baca identitas dari OneWeb.
export function getActorId(ctx: any): string | null {
  if (process.env.NODE_ENV === "production") return null; // header dev DILARANG di production
  const id = ctx.request.header["x-dev-user"];
  return typeof id === "string" && id ? id : null;
}
