import { useState, useEffect, useCallback, useMemo } from 'react';

const STORAGE_KEY = 'hodActiveBranchId';
const EVENT_NAME = 'hodBranchSwitch';

const getId = (v) => {
  if (!v) return null;
  if (typeof v === 'string') return v;
  return v?._id ? String(v._id) : null;
};

const buildHodBranches = (user) => {
  if (!user || user.role !== 'hod') return [];
  const seen = new Set();
  const result = [];
  const add = (b) => {
    if (!b) return;
    const id = getId(b);
    if (!id || seen.has(id)) return;
    seen.add(id);
    // b may be a plain string (raw ObjectId) or a populated object {_id, name, code}
    const displayName = typeof b === 'object' ? (b?.name || b?.code || null) : null;
    result.push({ _id: id, name: displayName || `Branch ${result.length + 1}` });
  };
  add(user.branch);
  add(user.department);
  (Array.isArray(user.branches) ? user.branches : []).forEach(add);
  return result;
};

const parseUser = () => {
  try {
    return JSON.parse(localStorage.getItem('user') || '{}');
  } catch (_) {
    return {};
  }
};

/**
 * useActiveBranch
 *
 * For HODs with multiple branches: tracks which branch is currently
 * "active" (selected) across all pages. Selection is persisted in
 * localStorage and broadcast via a custom DOM event so that all
 * mounted components using this hook stay in sync.
 *
 * For non-HOD users or HODs with a single branch this hook is a
 * no-op — isMultiBranch === false and activeBranchId is the only branch.
 */
const useActiveBranch = () => {
  // Computed once on mount — branch assignments only change after admin
  // modifies them (which requires a re-login / page refresh anyway).
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const hodBranches = useMemo(() => buildHodBranches(parseUser()), []);

  const [activeBranchId, setActiveBranchIdState] = useState(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && hodBranches.some((b) => b._id === stored)) return stored;
    return hodBranches[0]?._id || null;
  });

  // Expose a setter that persists + broadcasts
  const setActiveBranch = useCallback((id) => {
    localStorage.setItem(STORAGE_KEY, id);
    setActiveBranchIdState(id);
    window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: { branchId: id } }));
  }, []);

  // React to branch changes made from other mounted components
  useEffect(() => {
    const handler = (e) => {
      setActiveBranchIdState(e.detail?.branchId || null);
    };
    window.addEventListener(EVENT_NAME, handler);
    return () => window.removeEventListener(EVENT_NAME, handler);
  }, []);

  const activeBranchObj = useMemo(
    () => hodBranches.find((b) => b._id === activeBranchId) || hodBranches[0] || null,
    [hodBranches, activeBranchId]
  );

  return {
    /** Full list of branches this HOD manages */
    hodBranches,
    /** ID of currently selected branch (string) */
    activeBranchId: activeBranchObj?._id || null,
    /** Full object { _id, name } of selected branch */
    activeBranchObj,
    /** Display name of selected branch */
    activeBranchName: activeBranchObj?.name || '',
    /** Switch the active branch */
    setActiveBranch,
    /** True only when HOD manages ≥ 2 branches */
    isMultiBranch: hodBranches.length > 1,
  };
};

export default useActiveBranch;
