"use client";

import { useState } from "react";

type Props = {
  open: boolean;
  onClose: () => void;

  reason?: string | null;

  orderStatus: string;
  paymentStatus: string;

  onApprove: () => Promise<void>;
  onReject: (reason?: string) => Promise<void>;

  isLoading?: boolean;
};

export default function CancelRequestModal({
  open,
  onClose,
  reason,
  orderStatus,
  paymentStatus,
  onApprove,
  onReject,
  isLoading,
}: Props) {
  const [rejectReason, setRejectReason] = useState("");

  if (!open) return null;

  const handleApprove = async () => {
    await onApprove();
    onClose();
  };

  const handleReject = async () => {
    await onReject(rejectReason);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">

      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden">

        {/* HEADER */}
        <div className="p-5 border-b">
          <h2 className="text-lg font-semibold text-gray-900">
            Cancellation Requested
          </h2>

          <p className="text-sm text-gray-500 mt-1">
            Review customer cancellation request
          </p>
        </div>

        {/* CONTENT */}
        <div className="p-5 space-y-4">

          {/* REASON */}
          <div>
            <p className="text-xs font-medium text-gray-500 mb-1">
              CUSTOMER REASON
            </p>

            <div className="bg-gray-50 border rounded-xl p-3 text-sm text-gray-700">
              {reason || "No reason provided"}
            </div>
          </div>

          {/* STATUS SNAPSHOT */}
          <div className="grid grid-cols-2 gap-3">

            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-[10px] text-gray-500">
                ORDER STATUS
              </p>

              <p className="text-sm font-medium text-gray-900 mt-1">
                {orderStatus}
              </p>
            </div>

            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-[10px] text-gray-500">
                PAYMENT STATUS
              </p>

              <p className="text-sm font-medium text-gray-900 mt-1">
                {paymentStatus}
              </p>
            </div>

          </div>

          {/* REJECT REASON */}
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">
              REJECT REASON (OPTIONAL)
            </label>

            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Explain why cancellation is rejected..."
              className="w-full border rounded-xl p-3 text-sm min-h-[100px] resize-none outline-none focus:ring-2 focus:ring-gray-300"
            />
          </div>

        </div>

        {/* ACTIONS */}
        <div className="p-5 border-t bg-gray-50 flex gap-2">

          <button
            onClick={onClose}
            className="flex-1 border bg-white py-2 rounded-xl text-sm font-medium"
          >
            Close
          </button>

          <button
            onClick={handleReject}
            disabled={isLoading}
            className="flex-1 bg-red-600 text-white py-2 rounded-xl text-sm font-semibold disabled:opacity-50"
          >
            Reject
          </button>

          <button
            onClick={handleApprove}
            disabled={isLoading}
            className="flex-1 bg-green-600 text-white py-2 rounded-xl text-sm font-semibold disabled:opacity-50"
          >
            Approve
          </button>

        </div>
      </div>
    </div>
  );
}