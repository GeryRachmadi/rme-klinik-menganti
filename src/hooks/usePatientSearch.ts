import { useState, useCallback } from "react";

type ToastFn = (message: string, type: "success" | "error") => void;

function extractPatients(json: any): any[] {
  return json.data?.data || (Array.isArray(json.data) ? json.data : []);
}

/**
 * Manages all patient search state for the encounter registration flow.
 *
 * Two search modes:
 * - Simple: NIK or full name via Enter key
 * - Advanced: Name, No. RM, and/or date of birth via explicit submit button
 *
 * Magic transition: after a new patient is created via PatientRegistrationDrawer,
 * the caller fetches the full patient record by noRm and calls setSelectedPatient
 * directly, auto-selecting the new patient without requiring another search.
 */
export function usePatientSearch(showToast: ToastFn) {
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [isSearchEmpty, setIsSearchEmpty] = useState(false);
  const [isAdvancedSearch, setIsAdvancedSearch] = useState(false);
  const [advName, setAdvName] = useState("");
  const [advRm, setAdvRm] = useState("");
  const [advDob, setAdvDob] = useState("");

  const reset = useCallback(() => {
    setSelectedPatient(null);
    setSearchQuery("");
    setResults([]);
    setIsSearchEmpty(false);
    setIsAdvancedSearch(false);
    setAdvName("");
    setAdvRm("");
    setAdvDob("");
  }, []);

  function clearResults() {
    setResults([]);
  }

  function onSearchQueryChange(value: string) {
    setSearchQuery(value);
    setIsSearchEmpty(false);
  }

  function onAdvFieldChange(field: "name" | "rm" | "dob", value: string) {
    setIsSearchEmpty(false);
    if (field === "name") setAdvName(value);
    else if (field === "rm") setAdvRm(value);
    else setAdvDob(value);
  }

  async function handleSearch(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key !== "Enter" || !searchQuery.trim()) return;
    e.preventDefault();
    try {
      const res = await fetch(`/api/patients?search=${encodeURIComponent(searchQuery)}`);
      const json = await res.json();
      const patients = extractPatients(json);
      if (res.ok && patients.length > 0) {
        setResults(patients);
        setIsSearchEmpty(false);
      } else {
        setResults([]);
        showToast("Pasien tidak ditemukan.", "error");
        setSelectedPatient(null);
        setIsSearchEmpty(true);
      }
    } catch {
      setResults([]);
      showToast("Gagal mencari pasien.", "error");
      setSelectedPatient(null);
      setIsSearchEmpty(true);
    }
  }

  // Programmatic trigger for debounced autocomplete — no toast, minimum 2 chars.
  async function triggerSearch(query: string) {
    if (query.trim().length < 2) {
      setResults([]);
      setIsSearchEmpty(false);
      return;
    }
    try {
      const res = await fetch(`/api/patients?search=${encodeURIComponent(query.trim())}`);
      const json = await res.json();
      const patients = extractPatients(json);
      if (res.ok && patients.length > 0) {
        setResults(patients);
        setIsSearchEmpty(false);
      } else {
        setResults([]);
        setIsSearchEmpty(true);
      }
    } catch {
      setResults([]);
      setIsSearchEmpty(true);
    }
  }

  async function handleAdvancedSearch() {
    if (!advName.trim() && !advRm.trim() && !advDob.trim()) {
      showToast("Isi minimal satu kolom pencarian.", "error");
      return;
    }
    const params = new URLSearchParams();
    if (advName.trim()) params.append("name", advName.trim());
    if (advRm.trim()) params.append("rm", advRm.trim());
    if (advDob.trim()) params.append("dob", advDob.trim());
    try {
      const res = await fetch(`/api/patients?${params.toString()}`);
      if (!res.ok) throw new Error();
      const json = await res.json();
      const patients = extractPatients(json);
      if (patients.length > 0) {
        setSelectedPatient(patients[0]);
        setIsSearchEmpty(false);
      } else {
        showToast("Pasien tidak ditemukan.", "error");
        setSelectedPatient(null);
        setIsSearchEmpty(true);
      }
    } catch {
      showToast("Gagal melakukan pencarian spesifik.", "error");
      setSelectedPatient(null);
      setIsSearchEmpty(true);
    }
  }

  return {
    selectedPatient,
    setSelectedPatient,
    searchQuery,
    isSearchEmpty,
    isAdvancedSearch,
    setIsAdvancedSearch,
    advName,
    advRm,
    advDob,
    showEmptyState: isSearchEmpty && !selectedPatient,
    reset,
    onSearchQueryChange,
    onAdvFieldChange,
    handleSearch,
    handleAdvancedSearch,
    triggerSearch,
    results,
    clearResults,
  };
}
