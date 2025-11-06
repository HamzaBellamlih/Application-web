import React, { useState } from "react";

export default function ConvertirTXT() {
  const [csvText, setCsvText] = useState("");
  const [txtContent, setTxtContent] = useState("");
  const [error, setError] = useState("");
  const [filename, setFilename] = useState("converted.txt");

  const handleFile = (e) => {
    setError("");
    const f = e.target.files[0];
    if (!f) return;
    setFilename(f.name.replace(/\.[^/.]+$/, "") + ".txt");
    const reader = new FileReader();
    reader.onload = () => setCsvText(reader.result);
    reader.onerror = () => setError("Erreur lecture du fichier.");
    reader.readAsText(f, "utf-8");
  };

  const convert = () => {
    setError("");
    if (!csvText) {
      setError("Aucun CSV fourni.");
      return;
    }
    const lines = csvText.split(/\r?\n/).filter(Boolean);
    const out = lines.map((ln, idx) => {
      const cols = ln.split(",").map(c => c.trim());
      if (cols.length === 1) return `Ligne ${idx + 1}: ${cols[0]}`;
      return `Ligne ${idx + 1}: ` + cols.map((c, i) => `col${i + 1}=${c}`).join(" | ");
    }).join("\n");
    setTxtContent(out);
  };

  const download = () => {
    const blob = new Blob([txtContent], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ padding: 16 }}>
      <h3>Convertir CSV → TXT</h3>
      <input type="file" accept=".csv,text/csv,.txt" onChange={handleFile} />
      <div style={{ marginTop: 8 }}>
        <textarea
          rows={6}
          value={csvText}
          onChange={(e) => setCsvText(e.target.value)}
          placeholder="Ou collez le contenu CSV ici..."
          style={{ width: "100%" }}
        />
      </div>
      <div style={{ marginTop: 8 }}>
        <button onClick={convert} className="bg-blue-500 text-white px-3 py-1 rounded">Convertir</button>
        <button onClick={() => { setCsvText(""); setTxtContent(""); setError(""); }} style={{ marginLeft: 8 }}>Réinitialiser</button>
      </div>

      {error && <p style={{ color: "red" }}>{error}</p>}

      {txtContent && (
        <>
          <h4>Résultat TXT</h4>
          <textarea rows={8} readOnly value={txtContent} style={{ width: "100%" }} />
          <div style={{ marginTop: 8 }}>
            <button onClick={download} className="bg-green-600 text-white px-3 py-1 rounded">Télécharger .txt</button>
          </div>
        </>
      )}
    </div>
  );
}
