// Configuração lida em tempo de execução do arquivo config.json
export const cfg = { supabaseUrl: "", supabaseAnonKey: "" };

export async function carregarConfig(base = "/") {
  if (cfg.supabaseUrl) return cfg;
  const caminho = `${base.replace(/\/$/, "")}/config.json`;
  try {
    const r = await fetch(caminho, { cache: "no-store" });
    const j = await r.json();
    cfg.supabaseUrl = (j.supabaseUrl || "").replace(/\/$/, "");
    cfg.supabaseAnonKey = j.supabaseAnonKey || "";
  } catch {
    /* config.json ausente */
  }
  return cfg;
}

export const configOk = () => !!cfg.supabaseUrl && !!cfg.supabaseAnonKey;
