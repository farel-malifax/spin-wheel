"use client";
import api from "@/lib/axios";
import uploadToCloudinary from "@/lib/cloudinary";
import { Delete } from "@mui/icons-material";
import {
    Box,
    Button,
    FormControl,
    IconButton,
    MenuItem,
    Paper,
    Select,
    Stack,
    TextField,
    Typography
} from "@mui/material";
import axios from "axios";
import { useEffect, useState } from "react";
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';

export type Prize = {
    id?: number;
    name: string;
    winner: string | null;
    image?: string;
};


export default function SettingsPage() {
    const [participants, setParticipants] = useState<{ id: number; name: string; companyName?: string; token?: string }[]>([]);
    const [prizes, setPrizes] = useState<Prize[]>([]);
    const [queue, setQueue] = useState<any[]>([]);

    // Load All Data
    const loadData = async () => {
        try {
            const [participantsRes, prizesRes, queueRes] = await Promise.all([
                api.get("/participants"),
                api.get("/prizes"),
                api.get("/queue"),
            ]);
            // setParticipants(participantsRes.data);
            setParticipants((prev) => {
                const existingTokens = new Set(prev.map((p) => p.token));

                // filter hanya yang token belum ada di existing
                const newData = participantsRes.data.filter(
                    (p: any) => !existingTokens.has(p.token)
                );

                return [...prev, ...newData];
            });
            setPrizes(prizesRes.data);
            setQueue(queueRes.data);
        } catch (error) {
            console.error("Error loading data", error);
        }
    };

    // Fetch Queue Data
    const loadQueueData = async () => {
        try {
            const res = await api.get("/queue");
            setQueue(res.data);
        } catch (error) {
            console.error("Failed to fetch queue data", error);
        }
    }

    // Fetch Participant Data
    const loadParticipantData = async () => {
        try {
            const res = await api.get("/participants");
            setParticipants(res.data);
        } catch (error) {
            console.error("Failed to fetch participant data", error);
        }
    }

    // Reset Queue Data
    const resetQueueData = async () => {
        try {
            const res = await axios.get("/api/queue"); // ambil semua data queue
            const allQueue = res.data;

            // Loop semua data, update jadi is_spun = 0
            await Promise.all(
                allQueue.map((item: any) =>
                    axios.patch(`/api/queue`, { id: item.id, is_spun: 0 })
                )
            );

            console.log("Queue berhasil direset!");
            await loadQueueData(); // refresh data setelah reset
        } catch (error) {
            console.error("Gagal reset queue", error);
        }
    };


    // Function untuk mengubah urutan queue
    const moveQueue = async (idx: number, direction: "up" | "down") => {
        const newQueue = [...queue];
        if (direction === "up" && idx > 0) {
            [newQueue[idx - 1], newQueue[idx]] = [newQueue[idx], newQueue[idx - 1]];
        }
        if (direction === "down" && idx < newQueue.length - 1) {
            [newQueue[idx], newQueue[idx + 1]] = [newQueue[idx + 1], newQueue[idx]];
        }
        // Update order_num
        const updatedQueue = newQueue.map((item, i) => ({ ...item, order_num: i + 1 }));
        setQueue(updatedQueue);
        await api.post("/queue", { queue: updatedQueue });
        loadData();
    };

    const loadFromGoogleSheet = async () => {
        try {
            const sheetRes = await axios.get('/api/participants/google-sheet');
            const sheetData = sheetRes.data?.data || [];

            const localRes = await axios.get('/api/participants');
            const localData = localRes.data || [];

            // Gunakan token sebagai unique identifier
            const localTokens = new Set(localData.map((p: any) => p.token?.trim()));

            // Ambil peserta baru beserta companyName dan token, hanya jika token belum ada
            const newParticipants = sheetData
                .filter((p: any) => p.token && !localTokens.has(p.token.trim()))
                .map((p: any) => ({
                    name: p.fullName.trim(),
                    companyName: p.companyName?.trim() || "",
                    token: p.token?.trim() || ""
                }));

            if (newParticipants.length > 0) {
                // Gabungkan dengan data lokal
                const allParticipants = [
                    ...localData.map((p: any) => ({
                        name: p.name?.trim(),
                        companyName: p.companyName?.trim() || "",
                        token: p.token?.trim() || ""
                    })),
                    ...newParticipants
                ];

                // Update participantsText hanya dengan nama saja
                // setParticipantsText(
                //     allParticipants.map(p => p.name).join("\n")
                // );


                console.log({ newParticipants })
                await axios.post('/api/participants', {
                    participants: newParticipants,
                });
                loadParticipantData()
                console.log(`Added ${newParticipants.length} new participants from Google Sheet`);
            }
        } catch (err) {
            console.error('Gagal sync dari Google Sheet:', err);
        }
    };

    // Fetch Logic
    useEffect(() => {
        loadData();
        loadFromGoogleSheet();

        const interval = setInterval(() => {
            loadFromGoogleSheet();
        }, 10000);
        return () => clearInterval(interval);
    }, []);

    const savePrizes = async () => {
        try {
            console.log({ prizes })
            // Pastikan semua prize punya id
            const prizesWithId = prizes.map((p) => {
                if (typeof p.id === "number") return p;
                return { ...p, id: getNextTempId() };
            });
            await axios.post("/api/prizes", { prizes: prizesWithId });
            loadQueueData()
            // loadData(); // Refresh data setelah save
        } catch (error) {
            console.error("Failed to save prizes", error);
        }
    };


    // const autoSave = async () => {
    //     try {
    //         // Ambil data companyName dari localData jika ada
    //         const localRes = await axios.get('/api/participants');
    //         const localData = localRes.data || [];
    //         const companyMap = new Map(localData.map((p: any) => [p.name?.trim(), p.companyName?.trim() || ""]));

    //         const list = participantsText.split("\n").filter(Boolean);
    //         if (list.length === 0) return;
    //         const participantsObj = list.map((name) => ({
    //             name,
    //             companyName: companyMap.get(name) || ""
    //         }));

    //         await Promise.all([
    //             api.post("/participants", { participants: participantsObj }),
    //         ]);
    //         setParticipants(list);
    //         // setLastUpdated(new Date());
    //     } catch (error) {
    //         console.error("Auto-save failed", error);
    //     }
    // };

    const intervalTime = 10 * 1000 // On Seconds

    // useEffect(() => {
    //     const interval = setInterval(autoSave, intervalTime); // 30 detik
    //     return () => clearInterval(interval);
    // }, [participantsText, prizes]);

    const getNextTempId = () => {
        const minId = prizes.length > 0
            ? prizes.reduce((min, p) => (typeof p.id === "number" && p.id < min ? p.id : min), prizes[0].id ?? 0)
            : 0;
        return minId - 1;
    };

    const addPrize = () => {
        setPrizes([...prizes, { id: getNextTempId(), name: "", winner: null }]);
    };

    const updatePrize = (index: number, field: "name" | "winner", value: string | null) => {
        const updated = [...prizes];
        updated[index] = { ...updated[index], [field]: value };
        setPrizes(updated);
    };

    const removePrize = (index: number) => {
        const updated = prizes.filter((_, i) => i !== index);
        setPrizes(updated);
    };

    // Function submit participants dengan validasi token unik
    const onSubmitParticipants = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        // Ambil token yang sudah ada di database
        const localRes = await axios.get('/api/participants');
        const localData = localRes.data || [];
        const existingTokens = new Set(localData.map((p: any) => p.token?.trim()));

        // Filter hanya peserta dengan token yang belum ada di database
        const newParticipants = participants.filter((p) => {
            const token = typeof p.token === "string" ? p.token.trim() : "";
            return token && !existingTokens.has(token);
        });

        console.log({ newParticipants })
        if (newParticipants.length > 0) {
            // await axios.post("/api/participants", { participants: newParticipants });
            loadData();
        }
    };

    const resetParticipants = async () => {
        try {
            // update semua participant jadi is_deleted = false
            await Promise.all(
                participants.map((p) =>
                    axios.patch(`/api/participants/`, { id: p.id, is_deleted: false })
                )
            );

            // update state di frontend juga
            loadData()
            // setParticipants(
            //   participants.map((p) => ({
            //     ...p,
            //     is_deleted: false,
            //   }))
            // );

            console.log("All participants reset successfully");
        } catch (error) {
            console.error("Failed to reset participants:", error);
        }
    };

    return (
        <Box sx={{ p: 4, width: "100%" }}>
            <Typography variant="h4" gutterBottom>
                Settings
            </Typography>

            <Stack spacing={4} direction={"row"}>
                {/* Queue Section */}
                <Paper sx={{ p: 3, width: "30%", display: "flex", flexDirection: "column", gap: 3, }}>

                    <Box aria-label="top-area"
                        sx={{
                            width: "100%",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center"
                        }}
                    >
                        <Typography variant="h6" gutterBottom>
                            Queue
                        </Typography>
                        <Box aria-label="right-area"
                            sx={{
                                // width: "100%",
                                display: "flex",
                                alignItems: "center",
                                gap: 1,
                            }}
                        >
                            <Button aria-label="reset"
                                variant="outlined"
                                color="primary"
                                onClick={resetQueueData}
                            >
                                Reset Queue
                            </Button>
                            <Button aria-label="load"
                                variant="outlined"
                                color="primary"
                                onClick={loadQueueData}
                            >
                                Load Queue
                            </Button>
                        </Box>
                    </Box>

                    <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                        {queue.map((item, idx) => (
                            <Box key={item.id}
                                sx={{
                                    display: "flex", alignItems: "center",
                                    gap: 1, border: "1px solid #aaa",
                                    paddingY: 1, paddingX: 2,
                                    bgcolor: item.is_spun ? "#e0f7fa" : "transparent",
                                }}
                            >
                                <Typography sx={{ flex: 1 }}>{item.prize_name}</Typography>
                                <IconButton size="small" onClick={() => moveQueue(idx, "up")}
                                    disabled={idx === 0}>
                                    <ArrowUpwardIcon fontSize="small" />
                                </IconButton>
                                <IconButton size="small" onClick={() => moveQueue(idx, "down")}
                                    disabled={idx === queue.length - 1}>
                                    <ArrowDownwardIcon fontSize="small" />
                                </IconButton>
                            </Box>
                        ))}
                    </Box>
                </Paper>

                {/* Participants Section */}
                <Paper sx={{ p: 3, width: "30%" }}>
                    <Box aria-label=""
                        sx={{
                            width: "100%",
                            display: "flex",
                            justifyContent: "space-between",
                        }}
                    >
                        <Typography variant="h6" gutterBottom>
                            Participants
                        </Typography>

                        <Button onClick={resetParticipants} variant="contained">Reset Participants</Button>
                    </Box>
                    <Box component="form" onSubmit={onSubmitParticipants}>
                        <Box
                            sx={{
                                display: "flex",
                                flexDirection: "column",
                                gap: 1,
                                maxHeight: 500,
                                overflowY: "auto",
                                "&::-webkit-scrollbar": {
                                    width: "0px",
                                },
                                "&::-webkit-scrollbar-track": {
                                    backgroundColor: "transparent",
                                },
                                "&::-webkit-scrollbar-thumb": {
                                    backgroundColor: "blue",
                                    borderRadius: "8px",
                                },
                                "&::-webkit-scrollbar-thumb:hover": {
                                    backgroundColor: "#0044cc",
                                },
                                pt: 1,
                            }}
                        >
                            {participants.map((p, idx) => (
                                <Box key={p.token || idx}
                                    sx={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 1,
                                        border: "1px solid black",
                                        padding: 2,
                                    }}
                                >
                                    <Typography aria-label="text-display"
                                        sx={{
                                            fontSize: 16,
                                            color: "black"
                                        }}
                                    >
                                        {p.name} - {p.companyName}
                                    </Typography>
                                    {/* <IconButton color="error" onClick={() => {
                                        const updated = participants.filter((_, i) => i !== idx);
                                        setParticipants(updated);
                                    }}>
                                        <Delete />
                                    </IconButton> */}
                                </Box>
                            ))}
                        </Box>
                        {/* <Button type="submit" variant="constained" color="primary" sx={{ mt: 2 }}>Submit Participants</Button> */}
                    </Box>
                </Paper>

                {/* Prizes Section */}
                <Box aria-label="prizes-container"
                    sx={{
                        width: "30%",
                        p: 3,
                        display: "flex", flexDirection: "column",
                        gap: 2,
                        border: "1px solid gray",
                        boxShadow: 2, borderRadius: 1,
                    }}
                >
                    <Box aria-label="top-area"
                        sx={{
                            width: "100%",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                        }}
                    >
                        <Typography variant="h6" gutterBottom>
                            Prizes
                        </Typography>
                        <Button
                            variant="outlined"
                            color="primary"
                            onClick={addPrize}
                        >
                            + Add Prize
                        </Button>
                    </Box>
                    <Stack spacing={2}>
                        {prizes.map((prize, idx) => (
                            <Stack key={idx} direction="row" spacing={2} alignItems="center">
                                <TextField
                                    label="Prize Name"
                                    value={prize.name}
                                    onChange={(e) => updatePrize(idx, "name", e.target.value)}
                                    fullWidth
                                />

                                <FormControl sx={{ minWidth: 160 }}>
                                    <Select
                                        value={prize.winner || ""}
                                        onChange={(e) => updatePrize(idx, "winner", e.target.value || null)}
                                        displayEmpty
                                    >
                                        <MenuItem value="">(Random)</MenuItem>
                                        {participants.map((p) => (
                                            <MenuItem key={p.token || p.name} value={p.name}>
                                                {p.name}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>

                                {/* Upload Image */}
                                <IconButton color="error" onClick={() => removePrize(idx)}>
                                    <Delete />
                                </IconButton>
                            </Stack>

                        ))}
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={savePrizes}
                        >
                            Save Prizes
                        </Button>
                    </Stack>
                </Box>
            </Stack>
        </Box>
    );
}
