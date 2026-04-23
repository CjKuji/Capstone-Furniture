"use client";

import { useEffect, useState, useCallback } from "react";
import {
  getInquiries,
} from "@/services/inquiryService";

import type { Inquiry } from "@/types/inquiry";

export function useInquiries() {
  const [data, setData] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await getInquiries();
      setData(res);
    } catch {
      setError("Failed to load inquiries");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return {
    data,
    loading,
    error,
    refetch: fetch,
  };
}