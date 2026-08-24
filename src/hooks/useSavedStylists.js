import { useCallback, useEffect, useState } from "react";
import { APIService } from "./remote/apiService";
import { getAuthToken, showErrorToastMessage, showSuccessToastMessage } from "../utils/constant";

export const useSavedStylists = () => {
  const [savedIds, setSavedIds] = useState(() => new Set());
  const [loading, setLoading] = useState(false);

  const loadSaved = useCallback(async () => {
    if (!getAuthToken()) {
      setSavedIds(new Set());
      return;
    }
    setLoading(true);
    try {
      const response = await APIService.listSavedStylists();
      const ids = (response.data?.data || []).map((styler) => String(styler.stylerId));
      setSavedIds(new Set(ids));
    } catch (error) {
      // APIService displays the server error.
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSaved();
  }, [loadSaved]);

  const toggleSaved = useCallback(async (stylerId) => {
    if (!getAuthToken()) {
      showErrorToastMessage("Please sign in to save professionals");
      return;
    }
    const id = String(stylerId);
    const wasSaved = savedIds.has(id);
    setLoading(true);
    try {
      if (wasSaved) {
        await APIService.removeSavedStylist(id);
        setSavedIds((current) => {
          const next = new Set(current);
          next.delete(id);
          return next;
        });
        showSuccessToastMessage("Professional removed from saved list");
      } else {
        await APIService.saveStylist(id);
        setSavedIds((current) => new Set(current).add(id));
        showSuccessToastMessage("Professional saved");
      }
    } catch (error) {
      // APIService displays the server error.
    } finally {
      setLoading(false);
    }
  }, [savedIds]);

  return { savedIds, loading, toggleSaved };
};
