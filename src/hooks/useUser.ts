"use client";

import { useEffect, useState, useCallback } from "react";
import { getUsers, updateUser } from "@/services/userService";
import type { Profile } from "@/types/user";

export function useUsers() {
  const [data, setData] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);

  const fetch = useCallback(async () => {
    setLoading(true);

    try {
      const res = await getUsers();
      setData(res);
    } finally {
      setLoading(false);
    }
  }, []);

  const update = useCallback(async (id: string, payload: Partial<Profile>) => {
    await updateUser(id, payload);
    await fetch();
  }, [fetch]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, loading, update, refetch: fetch };
}