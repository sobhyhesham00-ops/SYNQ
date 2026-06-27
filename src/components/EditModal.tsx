import React from "react";
import { X, Save } from "lucide-react";
import { toast } from "sonner";
import { MultiAttachmentUpload } from "./MultiAttachmentUpload";
import { ProfessionalAttachmentUploader } from "./ProfessionalAttachmentUploader";
import { calculateTabbyTamaraPrice } from "../utils";

const CLINICS = [
  "dermadent",
  "onetouch_mo3tred",
  "onetouch_merkhnya",
  "welltouch",
  "newage",
];
const CLINIC_LABELS: Record<string, string> = {
  dermadent: "Dermadent",
  onetouch_mo3tred: "One Touch AlMutarid",
  onetouch_merkhnya: "One Touch Markhaniya",
  welltouch: "Well Touch",
  newage: "New Age",
};

export const EditModal = ({
  editingItem,
  setEditingItem,
  handleEditSave,
}: any) => {
  if (!editingItem) return null;
  return (
    <EditModalContent
      editingItem={editingItem}
      setEditingItem={setEditingItem}
      handleEditSave={handleEditSave}
    />
  );
};

const EditModalContent = ({
  editingItem,
  setEditingItem,
  handleEditSave,
}: any) => {
  const { type, data } = editingItem;

  const [editPhotos, setEditPhotos] = React.useState<string[]>(() => {
    const arr = [...(data.photos || [])];
    if (data.screenshot && !arr.includes(data.screenshot)) arr.push(data.screenshot);
    if (data.imageUrl && !arr.includes(data.imageUrl)) arr.push(data.imageUrl);
    if (data.paymentScreenshot && !arr.includes(data.paymentScreenshot)) arr.push(data.paymentScreenshot);
    if (data.attachment && !arr.includes(data.attachment)) arr.push(data.attachment);
    return arr;
  });

  const [editLinks, setEditLinks] = React.useState<string[]>(() => {
    const arr = [...(data.links || [])];
    if (data.paymentLink && !arr.includes(data.paymentLink)) arr.push(data.paymentLink);
    return arr;
  });

  const [editAttachments, setEditAttachments] = React.useState<any[]>(() => {
    return data.attachments ? [...data.attachments] : [];
  });

  const [tlPhotos, setTlPhotos] = React.useState<string[]>(() => [...(data.tlPhotos || [])]);
  const [tlLinks, setTlLinks] = React.useState<string[]>(() => [...(data.tlLinks || [])]);

  const [isAgentUploading, setIsAgentUploading] = React.useState(false);
  const [isTlUploading, setIsTlUploading] = React.useState(false);

  // Sync back to editingItem when photos/links change
  React.useEffect(() => {
    setEditingItem((prev: any) =>
      prev
        ? {
            ...prev,
            data: { 
              ...prev.data, 
              photos: editPhotos, 
              links: editLinks,
              tlPhotos,
              tlLinks,
              attachments: editAttachments,
              screenshot: null,
              imageUrl: null,
              paymentScreenshot: null,
              attachment: null,
              paymentLink: null
            },
          }
        : prev,
    );
  }, [editPhotos, editLinks, tlPhotos, tlLinks, editAttachments, setEditingItem]);

  const handleValidatedSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (type === "inquiry" && !data.text?.trim()) {
      toast.error("Inquiry text cannot be empty");
      return;
    }
    if (
      (type === "tt_request" || type === "tt_complaint") &&
      !data.patientName?.trim()
    ) {
      toast.error("Patient name required");
      return;
    }
    handleEditSave(e);
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    let newNotes = data.notes || "";
    let feeAmount = data.feeAmount;
    let finalPriceWithFee = data.finalPriceWithFee;
    let feeRate = data.feeRate;
    let currency = data.currency;

    if (e.target.name === "priceWithoutTax") {
      const pricing = calculateTabbyTamaraPrice(e.target.value);
      if (pricing.valid) {
        feeRate = 0.05;
        feeAmount = pricing.feeAmount;
        finalPriceWithFee = pricing.finalPrice;
        currency = "AED";

        const newNote = `[5% added to price. Final: ${pricing.finalPriceFormatted}]`;
        if (newNotes.includes("[5% added to price. Final: ")) {
          newNotes = newNotes.replace(/\[5% added to price\. Final: [^\]]+\]/g, newNote);
        } else {
          newNotes = newNotes ? `${newNote}\n\n${newNotes}` : newNote;
        }
      }
    }

    if (e.target.name === "notes") {
      newNotes = e.target.value;
    }

    setEditingItem({
      ...editingItem,
      data: {
        ...data,
        [e.target.name]: e.target.value,
        notes: newNotes,
        feeAmount,
        finalPriceWithFee,
        feeRate,
        currency
      },
    });
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditingItem({
      ...editingItem,
      data: {
        ...data,
        [e.target.name]: e.target.checked,
      },
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white/[0.04] border border-white/10 p-6 rounded-2xl w-full max-w-md shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={() => setEditingItem(null)}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-xl font-bold text-emerald-400 mb-6 flex items-center gap-2">
          <Save className="w-5 h-5" />
          Edit Request
        </h3>

        <form onSubmit={handleValidatedSave} className="space-y-4">
          {/* Clinic Name (Shared across most) */}
          {(type === "inquiry" ||
            type === "tt_request" ||
            type === "tt_complaint" ||
            type === "client_comm" ||
            type === "case") && (
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Clinic Name
              </label>
              <select
                name="clinicName"
                value={data.clinicName || ""}
                onChange={handleChange}
                className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500 transition-all font-sans cursor-pointer"
              >
                <option value="">Select a Clinic</option>
                {CLINICS.map((c) => (
                  <option key={c} value={c}>
                    {CLINIC_LABELS[c]}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Patient Details */}
          {(type === "tt_request" || type === "tt_complaint") && (
            <>
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Patient Name
                </label>
                <input
                  type="text"
                  name="patientName"
                  value={data.patientName || ""}
                  onChange={handleChange}
                  className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500 transition-all font-sans"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  File Number
                </label>
                <input
                  type="text"
                  name="fileNumber"
                  value={data.fileNumber || ""}
                  onChange={handleChange}
                  className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500 transition-all font-sans"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Phone Number
                </label>
                <input
                  type="text"
                  name="phoneNumber"
                  value={data.phoneNumber || ""}
                  onChange={handleChange}
                  className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500 transition-all font-sans"
                />
              </div>
            </>
          )}

          {type === "tt_request" && (
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Amount
              </label>
              <input
                type="text"
                name="priceWithoutTax"
                value={data.priceWithoutTax || ""}
                onChange={handleChange}
                className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500 transition-all font-sans"
              />
              {data.priceWithoutTax && calculateTabbyTamaraPrice(data.priceWithoutTax).valid && (
                <div className="mt-2 p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-xs space-y-1 font-mono">
                  <p className="text-indigo-300 font-bold mb-1.5 pb-1.5 border-b border-indigo-500/20">
                    5% will be added. Final amount: {calculateTabbyTamaraPrice(data.priceWithoutTax).finalPriceFormatted}
                  </p>
                  <div className="flex justify-between text-slate-400">
                    <span>Entered amount:</span>
                    <span>{calculateTabbyTamaraPrice(data.priceWithoutTax).priceBeforeFeeFormatted}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>5% amount:</span>
                    <span>{calculateTabbyTamaraPrice(data.priceWithoutTax).feeAmountFormatted}</span>
                  </div>
                  <div className="flex justify-between text-indigo-300 font-bold mt-1 pt-1 border-t border-indigo-500/20">
                    <span>Final amount:</span>
                    <span>{calculateTabbyTamaraPrice(data.priceWithoutTax).finalPriceFormatted}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {type === "tt_complaint" && (
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Complaint Details
              </label>
              <textarea
                name="complaintDetails"
                value={data.complaintDetails || ""}
                onChange={handleChange}
                rows={3}
                className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500 transition-all font-sans"
              />
            </div>
          )}

          {type === "inquiry" && (
            <>
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Phone Number
                </label>
                <input
                  type="text"
                  name="phoneNumber"
                  value={data.phoneNumber || ""}
                  onChange={handleChange}
                  className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500 transition-all font-sans"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Inquiry Text
                </label>
                <textarea
                  name="text"
                  value={data.text || ""}
                  onChange={handleChange}
                  rows={4}
                  className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500 transition-all font-sans"
                />
              </div>
            </>
          )}

          {type === "client_comm" && (
            <>
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Patient Name
                </label>
                <input
                  type="text"
                  name="patientName"
                  value={data.patientName || ""}
                  onChange={handleChange}
                  className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500 transition-all font-sans"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Phone Number
                </label>
                <input
                  type="text"
                  name="phoneNumber"
                  value={data.phoneNumber || ""}
                  onChange={handleChange}
                  className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500 transition-all font-sans"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Notes
                </label>
                <textarea
                  name="notes"
                  value={data.notes || ""}
                  onChange={handleChange}
                  rows={3}
                  className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500 transition-all font-sans"
                />
              </div>
            </>
          )}

          {type === "case" && (
            <>
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Patient Name
                </label>
                <input
                  type="text"
                  name="patientName"
                  value={data.patientName || ""}
                  onChange={handleChange}
                  className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500 transition-all font-sans"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Phone Number
                </label>
                <input
                  type="text"
                  name="phoneNumber"
                  value={data.phoneNumber || ""}
                  onChange={handleChange}
                  className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500 transition-all font-sans"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Notes
                </label>
                <textarea
                  name="notes"
                  value={data.notes || ""}
                  onChange={handleChange}
                  rows={3}
                  className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500 transition-all font-sans"
                />
              </div>
            </>
          )}

          {type === "scheduling_request" && (
            <>
              <div className="mb-4">
                <span className="inline-block px-3 py-1 bg-slate-800 text-slate-300 font-bold text-xs uppercase tracking-wider rounded-lg border border-slate-700">
                  {data.type === "swap" ? "Shift Swap" : "Annual Leave"}
                </span>
              </div>

              {data.type === "swap" && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Shift Date
                    </label>
                    <input
                      type="date"
                      name="date"
                      value={data.date || ""}
                      onChange={handleChange}
                      className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500 transition-all font-sans [color-scheme:dark]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Your Shift
                    </label>
                    <input
                      type="text"
                      name="shift"
                      value={data.shift || ""}
                      onChange={handleChange}
                      className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500 transition-all font-sans"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Swap With Agent
                    </label>
                    <input
                      type="text"
                      name="swapWithAgent"
                      value={data.swapWithAgent || ""}
                      onChange={handleChange}
                      className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500 transition-all font-sans"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Swap With Shift
                    </label>
                    <input
                      type="text"
                      name="swapWithShift"
                      value={data.swapWithShift || ""}
                      onChange={handleChange}
                      className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500 transition-all font-sans"
                    />
                  </div>
                </>
              )}

              {data.type === "annual" && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Start Date
                    </label>
                    <input
                      type="date"
                      name="startDate"
                      value={data.startDate || ""}
                      onChange={handleChange}
                      className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500 transition-all font-sans [color-scheme:dark]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      End Date
                    </label>
                    <input
                      type="date"
                      name="endDate"
                      value={data.endDate || ""}
                      onChange={handleChange}
                      className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500 transition-all font-sans [color-scheme:dark]"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Notes
                </label>
                <textarea
                  name="notes"
                  value={data.notes || ""}
                  onChange={handleChange}
                  rows={3}
                  className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500 transition-all font-sans"
                />
              </div>
            </>
          )}

          {/* Attachments Section */}
          <div className="pt-4 border-t border-white/10 space-y-4">
            {/* Agent Attachments */}
            <div>
              <p className="text-xs font-bold text-slate-300 uppercase mb-2 block">Agent Attachments</p>
              {type === "inquiry" ? (
                <ProfessionalAttachmentUploader
                  attachments={editAttachments}
                  links={editLinks}
                  onAttachmentsChange={setEditAttachments}
                  onLinksChange={setEditLinks}
                  onUploadStateChange={setIsAgentUploading}
                />
              ) : (
                <MultiAttachmentUpload
                  photos={editPhotos}
                  links={editLinks}
                  onPhotosChange={setEditPhotos}
                  onLinksChange={setEditLinks}
                  photosLabel="Add / Remove Agent Screenshots"
                  onUploadStateChange={setIsAgentUploading}
                />
              )}
            </div>

            {/* TL Attachments */}
            <div className="border-t border-white/5 pt-4">
              <p className="text-xs font-bold text-amber-400 uppercase mb-2 block">TL / Supervisor Attachments</p>
              <MultiAttachmentUpload
                photos={tlPhotos}
                links={tlLinks}
                onPhotosChange={setTlPhotos}
                onLinksChange={setTlLinks}
                photosLabel="Add / Remove TL Screenshots"
                onUploadStateChange={setIsTlUploading}
              />
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setEditingItem(null)}
              className="px-4 py-2 border border-white/10 hover:bg-white/5 rounded-xl text-sm font-semibold text-slate-300 transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isAgentUploading || isTlUploading}
              className={`px-6 py-2 ${isAgentUploading || isTlUploading ? 'bg-emerald-500/50 cursor-not-allowed text-slate-500' : 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:brightness-110 text-slate-900 cursor-pointer'} rounded-xl text-sm font-black transition-all flex items-center gap-2`}
            >
              {isAgentUploading ? 'Uploading Agent files...' : isTlUploading ? 'Uploading TL files...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
