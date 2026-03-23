import React, { useState } from "react";

export default function ConvertirCSV() {
  const [inputText, setInputText] = useState("");
  const [csvContent, setCsvContent] = useState("");
  const [error, setError] = useState("");
  const [filename, setFilename] = useState("converted.csv");

  const handleFile = (e) => {
    setError("");
    const f = e.target.files[0];
    if (!f) return;
    setFilename(f.name.replace(/\.[^/.]+$/, "") + ".csv");
    const reader = new FileReader();
    reader.onload = () => setInputText(reader.result);
    reader.onerror = () => setError("Erreur lecture du fichier.");
    reader.readAsText(f, "utf-8");
  };

  const convert = () => {
    setError("");
    if (!inputText) {
      setError("Aucun texte fourni.");
      return;
    }
    const lines = inputText.split(/\r?\n/).filter(Boolean);
    const csvLines = lines.map((ln) => {
      // Si la ligne contient déjà des virgules, on considère que c'est du CSV
      if (ln.includes(",")) return ln.trim();
      // sinon, on split sur tabulation, point-virgule ou espaces multiples
      const parts = ln.split(/\t|;|\s{2,}|\s+\|\s+|\s+/).map(p => p.trim()).filter(Boolean);
      // Échapper les champs contenant des virgules ou des guillemets
      const escaped = parts.map(p => (p.includes(",") || p.includes('"')) ? `"${p.replace(/"/g, '""')}"` : p);
      return escaped.join(",");
    });
    setCsvContent(csvLines.join("\n"));
  };

  const download = () => {
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8" });
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
      <h3>Convertir TXT → CSV</h3>
      <input type="file" accept=".txt,.csv,text/plain" onChange={handleFile} />
      <div style={{ marginTop: 8 }}>
        <textarea
          rows={8}
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Collez le texte ici (une ligne = un enregistrement)."
          style={{ width: "100%" }}
        />
      </div>
      <div style={{ marginTop: 8 }}>
        <button onClick={convert} className="bg-blue-500 text-white px-3 py-1 rounded">Convertir</button>
        <button onClick={() => { setInputText(""); setCsvContent(""); setError(""); }} style={{ marginLeft: 8 }}>Réinitialiser</button>
      </div>

      {error && <p style={{ color: "red" }}>{error}</p>}

      {csvContent && (
        <>
          <h4>CSV généré</h4>
          <textarea rows={8} readOnly value={csvContent} style={{ width: "100%" }} />
          <div style={{ marginTop: 8 }}>
            <button onClick={download} className="bg-green-600 text-white px-3 py-1 rounded">Télécharger .csv</button>
          </div>
        </>
      )}
    </div>
  );
}
