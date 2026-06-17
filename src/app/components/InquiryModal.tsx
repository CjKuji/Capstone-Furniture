"use client";

import React, { useState, useRef } from "react";
import { X, Plus, Trash2, Loader2, Package, Phone, MapPin, ClipboardList, Info, Upload, ImageIcon } from "lucide-react";
import { useCreateInquiry } from "@/hooks/useUserInquiry";
import { CreateInquiryPayload } from "@/services/inquiry/inquiryService";
import { supabase } from "@/lib/supabase";

interface CreateInquiryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface LocalInquiryItem {
  title?: string | null;
  description: string;
  quantity?: number;
  localFiles: File[];
}

export default function CreateInquiryModal({ isOpen, onClose }: CreateInquiryModalProps) {
  const createInquiryMutation = useCreateInquiry();
  const fileInputRefs = useRef<{ [key: number]: HTMLInputElement | null }>({});

  // =========================================================================
  // 1. COMPONENT STATES
  // =========================================================================
  const [deliveryMethod, setDeliveryMethod] = useState<"pickup" | "delivery">("delivery");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [pickupLocation] = useState("BL Sash Factory, 92 Upper Kalaklan Olongapo City");
  const [isTransmitting, setIsTransmitting] = useState(false);
  
  const [items, setItems] = useState<LocalInquiryItem[]>([
    { title: "", description: "", quantity: 1, localFiles: [] }
  ]);

  const [validationError, setValidationError] = useState<string | null>(null);

  if (!isOpen) return null;

  // =========================================================================
  // 2. DYNAMIC ITEM ARRAY LOGIC
  // =========================================================================
  const handleItemChange = (index: number, field: keyof LocalInquiryItem, value: any) => {
    setItems((prevItems) => {
      const updated = [...prevItems];
      updated[index] = { 
        ...updated[index], 
        [field]: field === "quantity" ? Math.max(1, parseInt(value) || 1) : value 
      };
      return updated;
    });
  };

  const handleFileSelection = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;

    const fileArray = Array.from(selectedFiles);

    // Validate sizes across all selected items
    for (const file of fileArray) {
      if (file.size > 5 * 1024 * 1024) {
        setValidationError(`"${file.name}" exceeds the maximum allowable size threshold of 5MB.`);
        return;
      }
    }

    setItems((prevItems) => {
      return prevItems.map((item, idx) => {
        if (idx !== index) return item;
        
        // Filter out duplicate files by tracking unique filename/size combinations
        const currentFileKeys = new Set(item.localFiles.map(f => `${f.name}-${f.size}`));
        const incomingUniqueFiles = fileArray.filter(f => !currentFileKeys.has(`${f.name}-${f.size}`));

        return {
          ...item,
          localFiles: [...item.localFiles, ...incomingUniqueFiles],
        };
      });
    });

    // Reset input value to ensure onChange continues to trigger correctly
    if (fileInputRefs.current[index]) {
      fileInputRefs.current[index]!.value = "";
    }
  };

  const removeSelectedFile = (itemIndex: number, fileIndex: number) => {
    setItems((prevItems) => 
      prevItems.map((item, idx) => {
        if (idx !== itemIndex) return item;
        return {
          ...item,
          localFiles: item.localFiles.filter((_, i) => i !== fileIndex)
        };
      })
    );
  };

  const addItemBlock = () => {
    setItems((prev) => [...prev, { title: "", description: "", quantity: 1, localFiles: [] }]);
  };

  const removeItemBlock = (index: number) => {
    if (items.length === 1) return;
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  // =========================================================================
  // 3. STORAGE UPLOAD PIPELINE
  // =========================================================================
  const uploadItemImagesToStorage = async (currentItems: LocalInquiryItem[]) => {
    const processes = currentItems.map(async (item, idx) => {
      if (!item.localFiles || item.localFiles.length === 0) {
        return {
          title: item.title,
          description: item.description,
          quantity: item.quantity,
          image_urls: []
        };
      }

      const uploadPromises = item.localFiles.map(async (file) => {
        const fileExtension = file.name.split(".").pop() || "png";
        // Sanitize string to prevent breaking REST transmission endpoints
        const dynamicHash = Math.random().toString(36).substring(2, 9);
        const uniqueFileName = `${Date.now()}-${dynamicHash}.${fileExtension}`;
        const filePath = `blueprints/${uniqueFileName}`;

        const { error: uploadError } = await supabase.storage
          .from("inquiry-attachments")
          .upload(filePath, file, { cacheControl: "3600", upsert: false });

        if (uploadError) {
          throw new Error(`Failed to upload "${file.name}" to asset stream: ${uploadError.message}`);
        }

        const { data: publicUrlData } = supabase.storage
          .from("inquiry-attachments")
          .getPublicUrl(filePath);

        return publicUrlData.publicUrl;
      });

      const uploadedUrls = await Promise.all(uploadPromises);

      return {
        title: item.title,
        description: item.description,
        quantity: item.quantity,
        image_urls: uploadedUrls
      };
    });

    return Promise.all(processes);
  };

  // =========================================================================
  // 4. FORM TRANSACTION SUBMISSION
  // =========================================================================
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (!phoneNumber.trim()) {
      setValidationError("A contact phone number is required so our craftsmen can follow up.");
      return;
    }
    if (deliveryMethod === "delivery" && !deliveryAddress.trim()) {
      setValidationError("Please specify a shipping delivery destination address.");
      return;
    }

    const cleanItems = items.filter(item => item.description.trim() !== "");
    if (cleanItems.length === 0) {
      setValidationError("At least one custom piece description must be provided.");
      return;
    }

    setIsTransmitting(true);

    try {
      const preparedPayloadItems = await uploadItemImagesToStorage(cleanItems);

      const payload: CreateInquiryPayload = {
        delivery_method: deliveryMethod,
        phone_number: phoneNumber.trim(),
        delivery_address: deliveryMethod === "delivery" ? deliveryAddress.trim() : null,
        pickup_location: deliveryMethod === "pickup" ? pickupLocation : null,
        items: preparedPayloadItems
      };

      createInquiryMutation.mutate(payload, {
        onSuccess: () => {
          setDeliveryMethod("delivery");
          setPhoneNumber("");
          setDeliveryAddress("");
          setItems([{ title: "", description: "", quantity: 1, localFiles: [] }]);
          setIsTransmitting(false);
          onClose();
        },
        onError: (err: any) => {
          setValidationError(err?.message || "An unexpected processing error dropped your submission framework.");
          setIsTransmitting(false);
        }
      });

    } catch (uploadFailError: any) {
      setValidationError(uploadFailError.message || "Failed to secure uploaded asset image references.");
      setIsTransmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-3xl max-h-[85vh] overflow-y-auto rounded-3xl border border-[#423120] bg-gradient-to-b from-[#140F0A] to-[#0E0A06] text-white shadow-[0_24px_60px_rgba(0,0,0,0.8)] scrollbar-thin scrollbar-thumb-white/10">
        
        {/* HEADER PANEL */}
        <div className="sticky top-0 z-10 bg-[#140F0A]/95 backdrop-blur-sm p-6 border-b border-white/5 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-extrabold tracking-tight flex items-center gap-2">
              Initialize Custom <span className="text-[#D4A97A] font-light italic">Design Blueprint</span>
            </h2>
            <p className="text-white/40 text-xs mt-0.5">Submit your specs and upload references to begin an open quote calibration.</p>
          </div>
          <button 
            type="button"
            onClick={onClose}
            disabled={isTransmitting}
            className="p-2 rounded-full border border-white/5 bg-white/[0.02] text-white/40 hover:text-white hover:bg-white/10 transition-colors duration-200 disabled:opacity-30"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-8">
          
          {validationError && (
            <div className="flex items-start gap-2 p-4 rounded-xl bg-red-950/20 border border-red-900/30 text-red-400 text-xs font-mono">
              <Info className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{validationError}</span>
            </div>
          )}

          {/* SECTION 1: LOGISTICS */}
          <div className="space-y-4">
            <h3 className="text-xs font-black uppercase tracking-widest text-[#A68056] flex items-center gap-1.5">
              <ClipboardList className="w-3.5 h-3.5" /> 1. Fulfillment & Logistics
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-white/50 tracking-wide uppercase">Fulfillment Method</label>
                <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-black/40 border border-white/5">
                  <button
                    type="button"
                    onClick={() => setDeliveryMethod("delivery")}
                    className={`py-2 text-xs font-bold rounded-lg transition-all ${deliveryMethod === "delivery" ? "bg-[#D4A97A] text-[#1C1209] shadow-md" : "text-white/60 hover:text-white"}`}
                  >
                    Cargo Delivery
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeliveryMethod("pickup")}
                    className={`py-2 text-xs font-bold rounded-lg transition-all ${deliveryMethod === "pickup" ? "bg-[#D4A97A] text-[#1C1209] shadow-md" : "text-white/60 hover:text-white"}`}
                  >
                    Workshop Pickup
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-white/50 tracking-wide uppercase flex items-center gap-1">
                  <Phone className="w-3 h-3 text-[#D4A97A]/60" /> Contact Mobile Number
                </label>
                <input
                  type="text"
                  placeholder="+63 912 345 6789"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full h-10 px-3.5 rounded-xl text-xs bg-black/40 border border-[#423120] focus:border-[#D4A97A] focus:outline-none font-mono"
                />
              </div>
            </div>

            {deliveryMethod === "delivery" ? (
              <div className="space-y-1.5 animate-fade-in">
                <label className="text-[11px] font-bold text-white/50 tracking-wide uppercase flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-[#D4A97A]/60" /> Shipping Destination Address
                </label>
                <input
                  type="text"
                  placeholder="Street Address, Apartment Unit, City, Province, Postal Code"
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  className="w-full h-10 px-3.5 rounded-xl text-xs bg-black/40 border border-[#423120] focus:border-[#D4A97A] focus:outline-none transition-all"
                />
              </div>
            ) : (
              <div className="p-3.5 rounded-xl bg-white/[0.01] border border-white/5 flex items-center gap-3 animate-fade-in">
                <MapPin className="w-4 h-4 text-[#D4A97A]" />
                <div>
                  <p className="text-xs font-bold text-white/80">Primary Pickup Point Allocation:</p>
                  <p className="text-[11px] text-white/40 font-mono mt-0.5">{pickupLocation}</p>
                </div>
              </div>
            )}
          </div>

          <hr className="border-white/5" />

          {/* SECTION 2: DYNAMIC SPECIFICATIONS LOOP */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-widest text-[#A68056] flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5" /> 2. Custom Piece Specifications
              </h3>
              <button
                type="button"
                onClick={addItemBlock}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#D4A97A]/30 text-[#D4A97A] bg-[#D4A97A]/5 hover:bg-[#D4A97A]/10 text-[10px] font-black uppercase tracking-wider transition-all"
              >
                <Plus className="w-3 h-3" /> Add Another Component
              </button>
            </div>

            <div className="space-y-4">
              {items.map((item, index) => (
                <div 
                  key={index} 
                  className="relative p-4 rounded-2xl border border-[#2A1F14] bg-white/[0.01] space-y-3 group/item transition-colors duration-200 hover:border-[#423120]"
                >
                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItemBlock(index)}
                      className="absolute top-4 right-4 p-1.5 rounded-md text-white/20 hover:text-red-400 hover:bg-red-500/10 transition-all opacity-0 group-hover/item:opacity-100 focus:opacity-100"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}

                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-2 space-y-1.5">
                      <label className="text-[10px] font-bold text-white/40 tracking-wide uppercase">Item Blueprint Title (Optional)</label>
                      <input
                        type="text"
                        placeholder="e.g., Solid Walnut Dining Table"
                        value={item.title || ""}
                        onChange={(e) => handleItemChange(index, "title", e.target.value)}
                        className="w-full h-9 px-3 rounded-lg text-xs bg-black/30 border border-white/5 focus:border-[#D4A97A] focus:outline-none transition-all"
                      />
                    </div>
                    <div className="col-span-1 space-y-1.5">
                      <label className="text-[10px] font-bold text-white/40 tracking-wide uppercase">Quantity</label>
                      <input
                        type="number"
                        min="1"
                        value={item.quantity || 1}
                        onChange={(e) => handleItemChange(index, "quantity", e.target.value)}
                        className="w-full h-9 px-3 rounded-lg text-xs bg-black/30 border border-white/5 focus:border-[#D4A97A] focus:outline-none font-mono"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-white/40 tracking-wide uppercase">Material & Size Parameters</label>
                    <textarea
                      rows={3}
                      placeholder="List clear dimensional criteria, target lumber selection (Walnut, Mahogany, Ash), and hardware accent finish details..."
                      value={item.description}
                      onChange={(e) => handleItemChange(index, "description", e.target.value)}
                      className="w-full p-3 rounded-lg text-xs bg-black/30 border border-white/5 focus:border-[#D4A97A] focus:outline-none transition-all resize-none leading-relaxed"
                      required
                    />
                  </div>

                  {/* NATIVE MULTI-UPLOADER SLOT */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-white/40 tracking-wide uppercase">Reference Design Blueprints</label>
                    
                    <input
                      type="file"
                      accept="image/*"
                      multiple={true}
                      ref={(el) => { fileInputRefs.current[index] = el; }}
                      onChange={(e) => handleFileSelection(index, e)}
                      className="hidden"
                    />

                    <button
                      type="button"
                      onClick={() => fileInputRefs.current[index]?.click()}
                      className="w-full py-4 border border-dashed border-white/10 hover:border-[#D4A97A]/40 rounded-xl flex flex-col items-center justify-center gap-1.5 bg-black/20 hover:bg-black/40 transition-all text-white/40 hover:text-white/60"
                    >
                      <Upload className="w-4 h-4 text-[#D4A97A]/80" />
                      <span className="text-[11px] font-medium font-sans">Upload reference blueprint layouts (Max 5MB • Hold Ctrl/Cmd to select multiple)</span>
                    </button>

                    {item.localFiles.length > 0 && (
                      <div className="space-y-1.5 mt-2">
                        {item.localFiles.map((file, fileIdx) => (
                          <div key={`${file.name}-${fileIdx}`} className="flex items-center justify-between p-2.5 rounded-xl bg-[#D4A97A]/5 border border-[#D4A97A]/20">
                            <div className="flex items-center gap-2 min-w-0">
                              <div className="w-8 h-8 rounded-lg bg-[#D4A97A]/10 flex items-center justify-center text-[#D4A97A] shrink-0">
                                <ImageIcon className="w-4 h-4" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-semibold text-white/80 truncate font-mono">{file.name}</p>
                                <p className="text-[10px] text-white/40 font-mono">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeSelectedFile(index, fileIdx)}
                              className="text-[10px] font-bold uppercase tracking-wider text-red-400 hover:text-red-300 px-2.5 py-1 rounded-md bg-red-500/5 hover:bg-red-500/10 transition-all"
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                </div>
              ))}
            </div>
          </div>

          {/* FOOTER BAR */}
          <div className="pt-4 border-t border-white/5 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isTransmitting}
              className="px-5 h-10 rounded-xl border border-white/5 text-xs font-bold text-white/60 hover:text-white hover:bg-white/[0.02] transition-all disabled:opacity-40"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isTransmitting}
              className="flex items-center justify-center gap-2 bg-[#D4A97A] hover:bg-[#C4976A] active:scale-95 disabled:scale-100 px-6 h-10 rounded-xl font-bold text-[#1C1209] text-xs uppercase tracking-wider transition-all shadow-md disabled:opacity-50"
            >
              {isTransmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Processing Assets...
                </>
              ) : (
                "Deploy Inquiry Package"
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}