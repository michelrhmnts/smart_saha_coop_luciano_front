import React, { useEffect, useRef, useState } from "react";
import {
  Bold,
  Underline,
  List,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Palette,
  Type,
} from "lucide-react";

const COLORS = [
  { label: "Par défaut", value: "#1f2937", bg: "bg-gray-800" },
  { label: "Vert bio", value: "#047857", bg: "bg-emerald-700" },
  { label: "Bleu", value: "#2563eb", bg: "bg-blue-600" },
  { label: "Rouge alerte", value: "#dc2626", bg: "bg-red-600" },
  { label: "Ambre", value: "#d97706", bg: "bg-amber-600" },
  { label: "Violet", value: "#7c3aed", bg: "bg-purple-600" },
];

const FONT_SIZES = [
  { label: "Petit (12px)", value: "1", px: "12px" },
  { label: "Normal (14px)", value: "3", px: "14px" },
  { label: "Moyen (16px)", value: "4", px: "16px" },
  { label: "Grand (18px)", value: "5", px: "18px" },
];

export default function RichTextEditor({
  name,
  value = "",
  onChange,
  placeholder = "Saisissez votre texte...",
  minHeight = "110px",
  label,
  required = false,
}) {
  const editorRef = useRef(null);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [selectedFontSize, setSelectedFontSize] = useState("3");
  const isUpdatingFromProps = useRef(false);

  // Synchronisation valeur externe vers l'éditeur
  useEffect(() => {
    if (editorRef.current) {
      const currentHtml = editorRef.current.innerHTML;
      const cleanValue = value || "";
      if (currentHtml !== cleanValue && !isUpdatingFromProps.current) {
        editorRef.current.innerHTML = cleanValue;
      }
    }
  }, [value]);

  const emitChange = () => {
    if (!editorRef.current || !onChange) return;
    const html = editorRef.current.innerHTML;
    // Si l'éditeur ne contient qu'un saut vide ou des balises orphelines
    const isCleanEmpty =
      !html ||
      html === "<br>" ||
      html === "<p><br></p>" ||
      html === "<div><br></div>" ||
      html.trim() === "";

    isUpdatingFromProps.current = true;
    onChange({
      target: {
        name,
        value: isCleanEmpty ? "" : html,
      },
    });
    setTimeout(() => {
      isUpdatingFromProps.current = false;
    }, 50);
  };

  const executeCommand = (command, commandValue = null) => {
    if (!editorRef.current) return;
    editorRef.current.focus();
    document.execCommand(command, false, commandValue);
    emitChange();
  };

  const handleFontSizeChange = (e) => {
    const size = e.target.value;
    setSelectedFontSize(size);
    executeCommand("fontSize", size);
  };

  const handleColorSelect = (color) => {
    executeCommand("foreColor", color);
    setShowColorPicker(false);
  };

  return (
    <div className="w-full">
      {label && (
        <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-slate-300">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}

      <div className="rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-xs focus-within:border-emerald-600 focus-within:ring-1 focus-within:ring-emerald-600 transition-all overflow-hidden">
        {/* Barre d'outils Word */}
        <div className="flex flex-wrap items-center gap-1 border-b border-gray-200 dark:border-slate-700 bg-gray-50/90 dark:bg-slate-900/90 px-3 py-1.5 text-gray-700 dark:text-slate-300 select-none">
          {/* Taille de police */}
          <div className="flex items-center gap-1 pr-1.5 border-r border-gray-200 dark:border-slate-700 mr-1">
            <Type className="w-3.5 h-3.5 text-gray-500 dark:text-slate-400 shrink-0" />
            <select
              value={selectedFontSize}
              onChange={handleFontSizeChange}
              title="Taille de police"
              className="rounded border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-1 text-xs font-medium text-gray-700 dark:text-slate-200 outline-none hover:border-gray-300 dark:hover:border-slate-600 cursor-pointer focus:ring-1 focus:ring-emerald-500"
            >
              {FONT_SIZES.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>
          </div>

          {/* Gras */}
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => executeCommand("bold")}
            title="Gras (Ctrl+B)"
            className="rounded p-1.5 text-gray-600 dark:text-slate-400 hover:bg-gray-200 dark:hover:bg-slate-700 hover:text-gray-900 dark:hover:text-white transition-colors cursor-pointer"
          >
            <Bold className="w-3.5 h-3.5" />
          </button>

          {/* Souligner */}
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => executeCommand("underline")}
            title="Souligner (Ctrl+U)"
            className="rounded p-1.5 text-gray-600 dark:text-slate-400 hover:bg-gray-200 dark:hover:bg-slate-700 hover:text-gray-900 dark:hover:text-white transition-colors cursor-pointer"
          >
            <Underline className="w-3.5 h-3.5" />
          </button>

          {/* Couleur de texte */}
          <div className="relative pr-1.5 border-r border-gray-200 dark:border-slate-700 mr-1">
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => setShowColorPicker(!showColorPicker)}
              title="Couleur du texte"
              className="flex items-center gap-0.5 rounded p-1.5 text-gray-600 dark:text-slate-400 hover:bg-gray-200 dark:hover:bg-slate-700 hover:text-gray-900 dark:hover:text-white transition-colors cursor-pointer"
            >
              <Palette className="w-3.5 h-3.5" />
            </button>

            {showColorPicker && (
              <div
                onMouseDown={(e) => e.preventDefault()}
                className="absolute left-0 top-full mt-1 z-30 flex items-center gap-1.5 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-2 shadow-lg"
              >
                {COLORS.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => handleColorSelect(c.value)}
                    title={c.label}
                    className={`w-5 h-5 rounded-full ${c.bg} hover:scale-110 transition-transform ring-1 ring-gray-200 dark:ring-slate-700 cursor-pointer`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Liste à puces */}
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => executeCommand("insertUnorderedList")}
            title="Liste à puces"
            className="rounded p-1.5 text-gray-600 dark:text-slate-400 hover:bg-gray-200 dark:hover:bg-slate-700 hover:text-gray-900 dark:hover:text-white transition-colors cursor-pointer pr-1.5 border-r border-gray-200 dark:border-slate-700 mr-1"
          >
            <List className="w-3.5 h-3.5" />
          </button>

          {/* Alignement : Gauche, Centre, Droite, Justifié */}
          <div className="flex items-center gap-0.5">
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => executeCommand("justifyLeft")}
              title="Aligner à gauche"
              className="rounded p-1.5 text-gray-600 dark:text-slate-400 hover:bg-gray-200 dark:hover:bg-slate-700 hover:text-gray-900 dark:hover:text-white transition-colors cursor-pointer"
            >
              <AlignLeft className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => executeCommand("justifyCenter")}
              title="Centrer"
              className="rounded p-1.5 text-gray-600 dark:text-slate-400 hover:bg-gray-200 dark:hover:bg-slate-700 hover:text-gray-900 dark:hover:text-white transition-colors cursor-pointer"
            >
              <AlignCenter className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => executeCommand("justifyRight")}
              title="Aligner à droite"
              className="rounded p-1.5 text-gray-600 dark:text-slate-400 hover:bg-gray-200 dark:hover:bg-slate-700 hover:text-gray-900 dark:hover:text-white transition-colors cursor-pointer"
            >
              <AlignRight className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => executeCommand("justifyFull")}
              title="Justifier"
              className="rounded p-1.5 text-gray-600 dark:text-slate-400 hover:bg-gray-200 dark:hover:bg-slate-700 hover:text-gray-900 dark:hover:text-white transition-colors cursor-pointer"
            >
              <AlignJustify className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Zone de saisie éditable */}
        <div
          ref={editorRef}
          contentEditable
          onInput={emitChange}
          onBlur={emitChange}
          data-placeholder={placeholder}
          style={{ minHeight }}
          className="rich-editor-content p-3 text-sm text-gray-800 dark:text-slate-100 outline-none leading-relaxed overflow-y-auto"
        />
      </div>

      {/* Style local pour le placeholder et les listes à puces */}
      <style>{`
        .rich-editor-content:empty:before {
          content: attr(data-placeholder);
          color: #9ca3af;
          pointer-events: none;
        }
        .rich-editor-content ul {
          list-style-type: disc;
          padding-left: 1.5rem;
          margin: 0.5rem 0;
        }
        .rich-editor-content ol {
          list-style-type: decimal;
          padding-left: 1.5rem;
          margin: 0.5rem 0;
        }
      `}</style>
    </div>
  );
}
