import React from "react";
import "./index.styl";
import { Navigate, Route, Routes } from "react-router-dom";
import BooksPage from "@client/pages/books";
import DictationPage from "@client/pages/dictation";
import VocabulariesPage from "@client/pages/vocabularies";

export default function App() {
  return (
    <div className="app-router">
      <Routes>
        <Route path="/" element={<Navigate to="/books" replace />} />
        <Route path="/books" element={<BooksPage />} />
        <Route path="/dictation" element={<DictationPage />} />
        <Route path="/vocabularies" element={<VocabulariesPage />} />
        <Route path="*" element={<Navigate to="/books" replace />} />
      </Routes>
    </div>
  );
}
