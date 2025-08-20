import { useRef } from "react";
import TextField from "@mui/material/TextField";
import axios from "axios";

function useDebounce(callback: any, delay: any) {
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    return (...args: any[]) => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => callback(...args), delay);
    };
}


type ParticipantsEditorProps = {
    participantsText: string;
    setParticipantsText: (text: string) => void;
    textFieldProps?: React.ComponentProps<typeof TextField>;
};

export default function ParticipantsEditor({ participantsText, setParticipantsText, textFieldProps }: ParticipantsEditorProps) {
    const saveParticipants = useDebounce((text: string) => {
        const participantsArray = text
            .split("\n")
            .map((p) => p.trim())
            .filter(Boolean);

        axios.post("/api/participants", { participants: participantsArray });
    }, 500); // Simpan setelah berhenti ngetik 0.5 detik

    return (
        <TextField
            multiline
            minRows={6}
            fullWidth
            value={participantsText}
            onChange={(e) => {
                const newText = e.target.value;
                setParticipantsText(newText);
                saveParticipants(newText);
            }}
            placeholder="Masukkan peserta, pisahkan dengan newline"
            {...textFieldProps}
        />
    );
}
