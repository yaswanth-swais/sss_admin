"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Plus,
  Pencil,
  Trash2,
  X,
  Users as UsersIcon,
  UserCheck,
  UserX,
  BookOpen,
  Mic,
  Volume2,
} from "lucide-react";

import { useLanguage } from "../../context/LanguageContext";
import { teacherTexts } from "./teachersTranslate";

import {
  textToVoice,
  voiceToText,
} from "../../services/adminAIService";

interface Teacher {
  id: string;
  name: string;
  subject: string;
  qualification: string;
  classId: string;
  section1: string;
  section2: string;
  role: string;
  contact: string;
  email: string;
  isClassTeacher: string;
  subjects: string;
  status: "active" | "inactive";
}

type SearchType = "name" | "id" | "subject";

export default function TeachersPage() {
  const {
    language,
    translations,
    translateBulk,
    translating,
  } = useLanguage();

  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isRecording, setIsRecording] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const [searchType, setSearchType] =
    useState<SearchType>("name");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] =
    useState<"add" | "modify">("add");

  const [selectedTeacher, setSelectedTeacher] =
    useState<Teacher | null>(null);

  const [selectedTeacherForVoice, setSelectedTeacherForVoice] =
    useState<Teacher | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    subject: "",
    qualification: "",
    classId: "",
    section1: "",
    section2: "",
    role: "TEACHER",
    contact: "",
    email: "",
    isClassTeacher: "",
    subjects: "",
  });

  const t = (key: keyof typeof teacherTexts) =>
    translations?.[key] || teacherTexts[key];

  const handleVoiceToText = async () => {
    if (isRecording) {
      mediaRecorderRef.current?.stop();
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });

      mediaStreamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event: BlobEvent) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        setIsRecording(false);

        try {
          const mimeType = mediaRecorder.mimeType || "audio/webm";

          const audioBlob = new Blob(audioChunksRef.current, {
            type: mimeType,
          });

          const extension = mimeType.includes("ogg")
            ? "ogg"
            : mimeType.includes("mp4")
            ? "mp4"
            : "webm";

          const audioFile = new File(
            [audioBlob],
            `recording.${extension}`,
            { type: mimeType }
          );

          const formData = new FormData();
          formData.append("file", audioFile);
          formData.append("language", "English");
          formData.append("user_email", "admin@sss.edu");
          formData.append("client_name", "SSS");

          const response = await voiceToText(formData);

          console.log("VOICE TO TEXT RESPONSE:", response);

          const transcribedText =
            response?.text ||
            response?.transcription ||
            response?.transcribed_text;

          if (transcribedText) {
            setSearchTerm(transcribedText);
          } else {
            console.log("Unexpected Voice-to-Text response:", response);
            alert(t("transcriptionNotReceived"));
          }
        } catch (error) {
          console.error("Voice to Text failed:", error);
          alert(t("voiceToTextFailed"));
        } finally {
          mediaStreamRef.current
            ?.getTracks()
            .forEach((track) => track.stop());

          mediaStreamRef.current = null;
          mediaRecorderRef.current = null;
          audioChunksRef.current = [];
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Microphone access failed:", error);
      alert(t("microphonePermission"));
    }
  };

  const handleTextToVoice = async () => {
    if (isPlaying && audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
      setIsPlaying(false);
      return;
    }

    if (!selectedTeacherForVoice) {
      alert(t("selectTeacherFirst"));
      return;
    }

    const teacher = selectedTeacherForVoice;

    const text = [
      `Teacher name ${teacher.name || "not available"}.`,
      `Subject ${teacher.subject || "not available"}.`,
      `Qualification ${teacher.qualification || "not available"}.`,
      `Class ${teacher.classId || "not assigned"}.`,
      `Section ${teacher.section1 || teacher.section2 || "not assigned"}.`,
      `Class teacher ${teacher.isClassTeacher === "Y" ? "Yes" : "No"}.`,
      `Contact ${teacher.contact || "not available"}.`,
      `Status ${teacher.status}.`,
    ].join(" ");

    try {
      const response = await textToVoice({
        text,
        language: "English",
        user_email: "admin@sss.edu",
        client_name: "SSS",
      });

      console.log("TEXT TO VOICE RESPONSE:", response);

      if (!response?.audio_base64) {
       alert(t("audioNotReceived"));
        return;
      }

      const audio = new Audio(
        `data:audio/mpeg;base64,${response.audio_base64}`
      );

      audioRef.current = audio;

      audio.onended = () => {
        setIsPlaying(false);
        audioRef.current = null;
      };

      audio.onerror = () => {
        setIsPlaying(false);
        audioRef.current = null;
      };

      setIsPlaying(true);
      await audio.play();
    } catch (error) {
      console.error("Teacher Text to Voice failed:", error);
      setIsPlaying(false);
      audioRef.current = null;
      alert(t("textToVoiceFailed"));
    }
  };

  useEffect(() => {
    fetchTeachers();

    return () => {
      mediaStreamRef.current
        ?.getTracks()
        .forEach((track) => track.stop());

      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  /* ---------------- DYNAMIC TEACHER TEXTS ---------------- */

const getDynamicTeacherTexts = () => {
  const dynamicTexts: Record<string, string> = {};

  teachers.forEach((teacher) => {
    if (teacher.name) {
      dynamicTexts[`teacherName_${teacher.id}`] =
        teacher.name;
    }
  });

  return dynamicTexts;
};
 /* ---------------- ONE BULK TRANSLATION ---------------- */

useEffect(() => {
  const dynamicTexts = getDynamicTeacherTexts();

  const allTexts = {
    ...teacherTexts,
    ...dynamicTexts,
  };

  translateBulk(allTexts);
}, [language, teachers]);

  const fetchTeachers = async () => {
    setLoading(true);

    try {
      const response = await fetch("/api/teachers");
      const data = await response.json();

      if (data.success) {
        setTeachers(data.teachers);
      }
    } catch (error) {
      console.error("Error fetching teachers:", error);
    } finally {
      setLoading(false);
    }
  };

  const validateEmail = (email: string): boolean => {
    if (!email) return true;

    return email.toLowerCase().endsWith("@gmail.com");
  };

  const handleAdd = async () => {
    if (!formData.name.trim()) {
      alert(t("fillTeacherName"));
      return;
    }

    if (
      formData.email &&
      !validateEmail(formData.email)
    ) {
      alert(t("invalidEmail"));
      return;
    }

    try {
      const response = await fetch("/api/teachers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          status: "active",
        }),
      });

      const data = await response.json();

      if (data.success) {
        await fetchTeachers();
        setIsModalOpen(false);
        resetForm();
      } else {
        alert(`${t("error")}: ${data.error}`);
      }
    } catch (error) {
      console.error("Error adding teacher:", error);
    }
  };

  const handleModify = async () => {
    if (!selectedTeacher) return;

    try {
      const response = await fetch(
        `/api/teachers/${selectedTeacher.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        }
      );

      const data = await response.json();

      if (data.success) {
        await fetchTeachers();
        setIsModalOpen(false);
        resetForm();
      }
    } catch (error) {
      console.error("Error modifying teacher:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t("deleteConfirmation"))) return;

    try {
      await fetch(`/api/teachers/${id}`, {
        method: "DELETE",
      });

      await fetchTeachers();
    } catch (error) {
      console.error("Error deleting teacher:", error);
    }
  };

  const handleToggleStatus = async (id: string) => {
    const teacher = teachers.find(
      (item) => item.id === id
    );

    if (!teacher) return;

    const newStatus =
      teacher.status === "active"
        ? "inactive"
        : "active";

    try {
      await fetch(`/api/teachers/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: newStatus,
        }),
      });

      await fetchTeachers();
    } catch (error) {
      console.error(
        "Error toggling status:",
        error
      );
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      subject: "",
      qualification: "",
      classId: "",
      section1: "",
      section2: "",
      role: "TEACHER",
      contact: "",
      email: "",
      isClassTeacher: "",
      subjects: "",
    });

    setSelectedTeacher(null);
  };

  const openModal = (
    type: "add" | "modify",
    teacher?: Teacher
  ) => {
    setModalType(type);

    if (type === "modify" && teacher) {
      setSelectedTeacher(teacher);

      setFormData({
        name: teacher.name,
        subject: teacher.subject || "",
        qualification: teacher.qualification || "",
        classId: teacher.classId || "",
        section1: teacher.section1 || "",
        section2: teacher.section2 || "",
        role: teacher.role || "TEACHER",
        contact: teacher.contact || "",
        email: teacher.email || "",
        isClassTeacher:
          teacher.isClassTeacher || "",
        subjects: teacher.subjects || "",
      });
    } else {
      resetForm();
    }

    setIsModalOpen(true);
  };

  const filteredTeachers = teachers.filter(
    (teacher) => {
      const term = searchTerm.toLowerCase();

      if (searchType === "id") {
        return String(teacher.id).includes(searchTerm);
      }

      if (searchType === "subject") {
        return (
          teacher.subject?.toLowerCase() || ""
        ).includes(term);
      }

      return (
        teacher.name?.toLowerCase() || ""
      ).includes(term);
    }
  );

  const stats = [
    {
      label: t("totalTeachers"),
      value: teachers.length,
      icon: UsersIcon,
      color: "from-blue-500 to-cyan-500",
    },
    {
      label: t("activeTeachers"),
      value: teachers.filter(
        (teacher) =>
          teacher.status === "active"
      ).length,
      icon: UserCheck,
      color: "from-green-500 to-emerald-500",
    },
    {
      label: t("inactiveTeachers"),
      value: teachers.filter(
        (teacher) =>
          teacher.status === "inactive"
      ).length,
      icon: UserX,
      color: "from-orange-500 to-red-500",
    },
  ];

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-white/60">
          {t("loadingTeachers")}
        </div>
      </div>
    );
  }

  return (
    <div>
      {translating && language !== "English" && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="flex items-center gap-3 rounded-xl bg-slate-900 px-6 py-4 text-white shadow-2xl">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />

            <span className="font-medium">
  {t("translating")} {language}...
</span>
          </div>
        </div>
      )}

      <motion.div className="mb-8">
        <h1 className="mb-2 flex items-center gap-3 text-4xl font-bold text-white">
          <BookOpen className="h-10 w-10 text-blue-400" />
          {t("pageTitle")}
        </h1>

        <p className="text-white/60">
          {t("pageSubtitle")}
        </p>
      </motion.div>

      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
        {stats.map((stat, index) => (
          <div
            key={index}
            className={`rounded-2xl bg-gradient-to-r ${stat.color} p-6 shadow-xl`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/80">
                  {stat.label}
                </p>

                <p className="mt-2 text-4xl font-bold text-white">
                  {stat.value}
                </p>
              </div>

              <stat.icon className="h-12 w-12 text-white/30" />
            </div>
          </div>
        ))}
      </div>

      <div className="mb-8 flex gap-4">
        <button
          onClick={() => openModal("add")}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-3 font-semibold text-white"
        >
          <Plus size={20} />
          {t("addTeacher")}
        </button>

        <button
          onClick={() => {
            if (filteredTeachers.length === 1) {
              openModal(
                "modify",
                filteredTeachers[0]
              );
              return;
            }

            if (filteredTeachers.length > 0) {
              const id = prompt(
                t("enterTeacherId")
              );

              if (!id) return;

              const teacher = teachers.find(
                (item) => item.id === id
              );

              if (teacher) {
                openModal("modify", teacher);
              } else {
                alert(t("teacherNotFound"));
              }

              return;
            }

            alert(t("noTeachersAvailable"));
          }}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-3 font-semibold text-white"
        >
          <Pencil size={20} />
          {t("modifyTeacher")}
        </button>
      </div>

      <div className="mb-4 flex flex-wrap gap-4">
        <div className="relative min-w-[200px] flex-1">
          <input
            type="text"
            placeholder={t("search")}
            value={searchTerm}
            onChange={(event) =>
              setSearchTerm(event.target.value)
            }
            className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 pr-16 text-white placeholder-white/40 focus:border-white/40 focus:outline-none"
          />

          <button
            type="button"
            onClick={handleVoiceToText}
           title={
           isRecording
           ? t("stopRecording")
           : t("startRecording")
}
            className={`absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full transition ${
              isRecording
                ? "bg-red-500 text-white animate-pulse"
                : "bg-white/10 text-white hover:bg-white/20"
            }`}
          >
            <Mic size={22} strokeWidth={2.3} />
          </button>
        </div>

        <select
          value={searchType}
          onChange={(event) =>
            setSearchType(
              event.target.value as SearchType
            )
          }
          className="rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white focus:border-white/40 focus:outline-none"
        >
          <option
            value="name"
            className="text-black"
          >
            {t("searchByName")}
          </option>

          <option
            value="id"
            className="text-black"
          >
            {t("searchById")}
          </option>

          <option
            value="subject"
            className="text-black"
          >
            {t("searchBySubject")}
          </option>
        </select>
      </div>

      <div className="mb-6 flex justify-end">
        <button
          type="button"
          onClick={handleTextToVoice}
          disabled={!selectedTeacherForVoice && !isPlaying}
         title={
  isPlaying
    ? t("stopAudio")
    : selectedTeacherForVoice
    ? `${t("listenSelectedTeacher")}: ${
        translations[
          `teacherName_${selectedTeacherForVoice.id}`
        ] || selectedTeacherForVoice.name
      }`
    : t("selectTeacherFirst")
}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 font-medium transition ${
            isPlaying
              ? "bg-red-500 text-white hover:bg-red-600"
              : selectedTeacherForVoice
              ? "bg-purple-600 text-white hover:bg-purple-700"
              : "cursor-not-allowed bg-white/10 text-white/40"
          }`}
        >
          {isPlaying
        ? t("stop")
        : selectedTeacherForVoice
        ? t("listenSelectedTeacher")
        : t("selectTeacher")}
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl bg-white/5 backdrop-blur-xl">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1200px]">
            <thead className="bg-white/10">
              <tr>
                <th className="px-4 py-4 text-left text-white">
                  {t("id")}
                </th>

                <th className="px-4 py-4 text-left text-white">
                  {t("name")}
                </th>

                <th className="px-4 py-4 text-left text-white">
                  {t("subject")}
                </th>

                <th className="px-4 py-4 text-left text-white">
                  {t("qualification")}
                </th>

                <th className="px-4 py-4 text-left text-white">
                  {t("classId")}
                </th>

                <th className="px-4 py-4 text-left text-white">
                  {t("section")}
                </th>

                <th className="px-4 py-4 text-left text-white">
                  {t("classTeacher")}
                </th>

                <th className="px-4 py-4 text-left text-white">
                  {t("contact")}
                </th>

                <th className="px-4 py-4 text-left text-white">
                  {t("status")}
                </th>

                <th className="px-4 py-4 text-left text-white">
                  {t("actions")}
                </th>
              </tr>
            </thead>

            <tbody>
              {filteredTeachers.map((teacher) => (
                <tr
                  key={teacher.id}
                  onClick={() =>
                    setSelectedTeacherForVoice(teacher)
                  }
                  className={`cursor-pointer border-t transition ${
                    selectedTeacherForVoice?.id === teacher.id
                      ? "border-purple-500 bg-purple-500/10 ring-1 ring-inset ring-purple-500/40"
                      : "border-white/10 hover:bg-white/5"
                  }`}
                >
                  <td className="px-4 py-4 text-white/80">
                    {teacher.id}
                  </td>

                 <td className="px-4 py-4 text-white">
                 {translations[`teacherName_${teacher.id}`] ||
                 teacher.name}
                 </td>

                  <td className="px-4 py-4 text-white/80">
                    {teacher.subject || "—"}
                  </td>

                  <td className="px-4 py-4 text-white/80">
                    {teacher.qualification || "—"}
                  </td>

                  <td className="px-4 py-4 text-white/80">
                    {teacher.classId || "—"}
                  </td>

                  <td className="px-4 py-4 text-white/80">
                    {teacher.section1 ||
                      teacher.section2 ||
                      "—"}
                  </td>

                  <td className="px-4 py-4 text-white/80">
                    {teacher.isClassTeacher === "Y"
                      ? t("yes")
                      : "—"}
                  </td>

                  <td className="px-4 py-4 text-white/80">
                    {teacher.contact || "—"}
                  </td>

                  <td className="px-4 py-4">
                    <button
                      onClick={(event) => {
                        event.stopPropagation();
                        handleToggleStatus(
                          teacher.id
                        );
                      }}
                      className={`rounded-full px-3 py-1 text-sm font-semibold ${
                        teacher.status === "active"
                          ? "bg-green-500/20 text-green-400"
                          : "bg-red-500/20 text-red-400"
                      }`}
                    >
                      {teacher.status === "active"
                        ? t("active")
                        : t("inactive")}
                    </button>
                  </td>

                  <td className="px-4 py-4">
                    <div className="flex gap-2">
                      <button
                        onClick={(event) => {
                          event.stopPropagation();
                          openModal(
                            "modify",
                            teacher
                          );
                        }}
                        className="rounded-lg p-2 text-blue-400 hover:bg-blue-500/20"
                      >
                        <Pencil size={16} />
                      </button>

                      <button
                        onClick={(event) => {
                          event.stopPropagation();
                          handleDelete(teacher.id);
                        }}
                        className="rounded-lg p-2 text-red-400 hover:bg-red-500/20"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md">
            <motion.div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 p-8">
              <div className="mb-6 flex justify-between">
                <h2 className="text-2xl font-bold text-white">
                  {modalType === "add"
                    ? t("addNewTeacher")
                    : t("modifyTeacher")}
                </h2>

                <button
                  onClick={() =>
                    setIsModalOpen(false)
                  }
                >
                  <X
                    size={24}
                    className="text-white/40"
                  />
                </button>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <input
                  type="text"
                  placeholder={t("teacherName")}
                  value={formData.name}
                  onChange={(event) =>
                    setFormData({
                      ...formData,
                      name: event.target.value,
                    })
                  }
                  className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white placeholder-white/40"
                />

                <input
                  type="text"
                  placeholder={t(
                    "subjectPlaceholder"
                  )}
                  value={formData.subject}
                  onChange={(event) =>
                    setFormData({
                      ...formData,
                      subject: event.target.value,
                    })
                  }
                  className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white placeholder-white/40"
                />

                <input
                  type="text"
                  placeholder={t(
                    "qualificationPlaceholder"
                  )}
                  value={formData.qualification}
                  onChange={(event) =>
                    setFormData({
                      ...formData,
                      qualification:
                        event.target.value,
                    })
                  }
                  className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white placeholder-white/40"
                />

                <input
                  type="text"
                  placeholder={t(
                    "classIdPlaceholder"
                  )}
                  value={formData.classId}
                  onChange={(event) =>
                    setFormData({
                      ...formData,
                      classId: event.target.value,
                    })
                  }
                  className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white placeholder-white/40"
                />

                <input
                  type="text"
                  placeholder={t("section1")}
                  value={formData.section1}
                  onChange={(event) =>
                    setFormData({
                      ...formData,
                      section1:
                        event.target.value,
                    })
                  }
                  className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white placeholder-white/40"
                />

                <input
                  type="text"
                  placeholder={t("section2")}
                  value={formData.section2}
                  onChange={(event) =>
                    setFormData({
                      ...formData,
                      section2:
                        event.target.value,
                    })
                  }
                  className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white placeholder-white/40"
                />

                <select
                  value={formData.role}
                  onChange={(event) =>
                    setFormData({
                      ...formData,
                      role: event.target.value,
                    })
                  }
                  className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white"
                >
                  <option
                    value="TEACHER"
                    className="text-black"
                  >
                    {t("teacher")}
                  </option>

                  <option
                    value="HEAD_TEACHER"
                    className="text-black"
                  >
                    {t("headTeacher")}
                  </option>

                  <option
                    value="PRINCIPAL"
                    className="text-black"
                  >
                    {t("principal")}
                  </option>
                </select>

                <select
                  value={formData.isClassTeacher}
                  onChange={(event) =>
                    setFormData({
                      ...formData,
                      isClassTeacher:
                        event.target.value,
                    })
                  }
                  className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white"
                >
                  <option
                    value=""
                    className="text-black"
                  >
                    {t("isClassTeacher")}
                  </option>

                  <option
                    value="Y"
                    className="text-black"
                  >
                    {t("yes")}
                  </option>

                  <option
                    value="N"
                    className="text-black"
                  >
                    {t("no")}
                  </option>
                </select>

                <input
                  type="text"
                  placeholder={t(
                    "subjectsPlaceholder"
                  )}
                  value={formData.subjects}
                  onChange={(event) =>
                    setFormData({
                      ...formData,
                      subjects:
                        event.target.value,
                    })
                  }
                  className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white placeholder-white/40"
                />

                <input
                  type="tel"
                  placeholder={t("contactNumber")}
                  value={formData.contact}
                  onChange={(event) =>
                    setFormData({
                      ...formData,
                      contact:
                        event.target.value,
                    })
                  }
                  className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white placeholder-white/40"
                />

                <input
                  type="email"
                  placeholder={t(
                    "emailPlaceholder"
                  )}
                  value={formData.email}
                  onChange={(event) =>
                    setFormData({
                      ...formData,
                      email: event.target.value,
                    })
                  }
                  className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white placeholder-white/40"
                />
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  onClick={
                    modalType === "add"
                      ? handleAdd
                      : handleModify
                  }
                  className="flex-1 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 py-3 font-semibold text-white"
                >
                  {modalType === "add"
                    ? t("addTeacher")
                    : t("saveChanges")}
                </button>

                <button
                  onClick={() =>
                    setIsModalOpen(false)
                  }
                  className="flex-1 rounded-xl bg-white/10 py-3 font-semibold text-white"
                >
                  {t("cancel")}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}