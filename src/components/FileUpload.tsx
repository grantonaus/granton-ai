import { useState, useCallback, useRef, useEffect } from "react";
import { cn } from "@/lib/utils"; // shadcn utility function for conditionally merging class names
import { Button } from "@/components/ui/button";
import { UploadCloud, FileText, Trash2, Download, Paperclip } from "lucide-react"; // shadcn icons
import { Input } from "@/components/ui/input";

interface ExistingAttachment {
    name: string;
    url: string;
    key: string;
}

interface FileUploadProps {
    existingFiles?: ExistingAttachment[];
    onRemoveExisting?: (key: string) => void;
    onFileChange: (files: File[]) => void;
    acceptedTypes?: string;
    maxFiles?: number;
}

const FileUpload: React.FC<FileUploadProps> = ({
    onFileChange,
    acceptedTypes = ".pdf",
    maxFiles = 3,
    existingFiles = [],
    onRemoveExisting,
}) => {
    const [newFiles, setNewFiles] = useState<File[]>([]);
    const [isDragOver, setIsDragOver] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const slotsLeft = maxFiles - (existingFiles.length + newFiles.length);

    const isValidFileType = (file: File) => {
        const validTypes = [
            "application/pdf",
        ];
        return validTypes.includes(file.type);
    };

    useEffect(() => {
        if (newFiles.length === 0) return;
        const filtered = newFiles.filter(file =>
            !existingFiles.some(e => e.name === file.name)
        );
        if (filtered.length !== newFiles.length) {
            setNewFiles(filtered);
            onFileChange(filtered);
        }
    }, [existingFiles]);



    const handleFileSelection = (selectedFiles: File[]) => {
        const validPdfs = selectedFiles.filter(isValidFileType);
        const invalid = selectedFiles.filter((f) => !isValidFileType(f));


        if (invalid.length > 0) {
            setError("Only PDF files are allowed.");
        } else {
            setError(null);
        }

        const merged = [...newFiles, ...validPdfs];


        const sliced = merged.slice(0, maxFiles - existingFiles.length);
        setNewFiles(sliced);
        onFileChange(sliced);
        
    };

    const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selected = Array.from(e.target.files || []);
        handleFileSelection(selected);
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragOver(false);
        if (slotsLeft <= 0) return;
        const droppedFiles = Array.from(e.dataTransfer.files);
        handleFileSelection(droppedFiles);
    };

    const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        if (slotsLeft <= 0) return;
        setIsDragOver(true);
    }, [slotsLeft]);

    const handleDragLeave = useCallback(() => {
        setIsDragOver(false);
    }, []);



    const handleRemoveNewFile = (fileToRemove: File) => {
        const updated = newFiles.filter((f) => f !== fileToRemove);
        setNewFiles(updated);
        setError(null);
    };


    const handleRemoveExistingClick = (key: string) => {
        onRemoveExisting?.(key);
    };

    const handleDownloadNewFile = (file: File) => {
        const url = URL.createObjectURL(file);
        const link = document.createElement("a");
        link.href = url;
        link.download = file.name;
        link.click();
        URL.revokeObjectURL(url);
    };

    const handleClick = () => {
        if (slotsLeft <= 0) return;
        fileInputRef.current?.click();
    };


    return (
        <div className="w-full">
            <div
                className={cn(
                    "cursor-pointer relative bg-background rounded-md p-0.5 hover:bg-[#0d0d0d] text-white w-full flex flex-col items-center justify-center px-4 py-6 border transition-all duration-300",
                    isDragOver ? "border-[#68FCF2] bg-[#0d0d0d]" : "border-dashed",
                    error ? "border-red-500" : ""
                )}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={handleClick} 
            >


                <div className="flex items-center justify-center rounded-md h-8 w-8 bg-[#141414] mb-2">
                    <svg
                        width="22"
                        height="22"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <path
                            d="M12.75 21C12.75 21.4142 12.4142 21.75 12 21.75C11.5858 21.75 11.25 21.4142 11.25 21V18.2119L12.75 18.21V21ZM11.4443 6C13.835 6 15.905 7.3728 16.9092 9.37305C16.9111 9.3769 16.9157 9.37952 16.9199 9.37891C19.5452 9.00301 21.9997 11.1047 22 13.7773C22 16.0819 20.2459 17.9772 18 18.2002L12.75 18.21V14.8105L13.9697 16.0303L14.0264 16.082C14.3209 16.3223 14.7557 16.3048 15.0303 16.0303C15.3049 15.7557 15.3223 15.3209 15.082 15.0264L15.0303 14.9697L12.8838 12.8232L12.7891 12.7373C12.3308 12.3635 11.6692 12.3635 11.2109 12.7373L11.1162 12.8232L8.96973 14.9697C8.67688 15.2626 8.67685 15.7374 8.96973 16.0303C9.26261 16.3231 9.73739 16.3231 10.0303 16.0303L11.25 14.8105V18.2119L6 18.2227H5.33301C3.49221 18.2225 2 16.7295 2 14.8887C2.00012 13.0606 3.52692 11.5543 5.34863 11.5557C5.3537 11.5557 5.35874 11.5519 5.35938 11.5469C5.64432 8.43653 8.25968 6.00006 11.4443 6Z"
                            fill="#6D6D6D"
                        />
                    </svg>
                </div>
                <p className="mb-1 text-md font-semibold text-white">Upload file</p>
                <p className="text-sm text-gray-500 dark:text-[#595959]">
                    Drag and drop your PDF here, or click to upload
                </p>


                <Input
                    ref={fileInputRef}
                    type="file"
                    accept={acceptedTypes}
                    multiple={false}
                    onChange={handleFileInputChange}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                />
            </div>

            {error && <p className="text-red-500 text-xs mt-2 text-center">{error}</p>}

            {existingFiles.length > 0 && (
                <div className="mt-3 space-y-3">
                    {existingFiles.map((att) => (
                        <div key={att.key} className="flex items-center justify-between bg-[#191C1C] rounded-md px-4 py-1">
                            <div className="flex items-center space-x-2">
                                <Paperclip className="size-4 text-[#68FCF2] mr-2" />
                                <div>
                                    <div className="text-sm font-medium text-[#68FCF2]">{att.name}</div>
                                </div>
                            </div>
                            {onRemoveExisting && (
                                <Button variant="ghost" size="icon" onClick={() => handleRemoveExistingClick(att.key)}>
                                    <Trash2 className="h-4 w-4 text-orange-600" />
                                </Button>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {newFiles.length > 0 && (
                <div className="mt-3 space-y-3">
                    {newFiles.map((file, idx) => (
                        <div key={`new-${idx}`} className="flex items-center justify-between bg-[#191C1C] rounded-md px-4 py-1">
                            <div className="flex items-center space-x-2">
                                <Paperclip className="size-4 text-[#68FCF2D] mr-2" />
                                <div>
                                    <div className="text-sm font-medium text-[#68FCF2]">{file.name}</div>
                                </div>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Button variant="ghost" size="icon" onClick={() => handleRemoveNewFile(file)}>
                                    <Trash2 className="h-4 w-4 text-orange-600" />
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default FileUpload;
