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
} from "lucide-react";

import { useLanguage } from "../../context/LanguageContext";
import { teacherTexts } from "./teachersTranslate";

import {
  textToVoice,
  voiceToText,
} from "../../services/adminAIService";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "";

export default function TeachersPage() {
  /* =========================================================
     LANGUAGE / AI
  ========================================================= */

  const {
    language,
    translations,
    translateBulk,
    translating,
  } = useLanguage();

  /* =========================================================
     STATE
  ========================================================= */

  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");
  const [searchType, setSearchType] = useState("name");

  const [isRecording, setIsRecording] = useState(false);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const mediaStreamRef = useRef(null);

  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState("add");

  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [selectedTeacherForVoice, setSelectedTeacherForVoice] =
    useState(null);

  const [validationError, setValidationError] = useState("");

  const [formData, setFormData] = useState({
    teacher_id: "",
    full_name: "",
    subject_name: "",
    qualification: "",
    class_id: "",
    section_1: "",
    section_2: "",
    role: "Teacher",
    is_class_teacher: false,
    subjects: "",
    phone: "",
    email_id: "",
    is_active: true,
  });

  /* =========================================================
     TRANSLATION HELPER
  ========================================================= */

  const t = (key) => {
    return translations?.[key] || teacherTexts?.[key] || key;
  };

  /* =========================================================
     FETCH TEACHERS
  ========================================================= */

  const fetchTeachers = async () => {
    setLoading(true);

    try {
      /*
       * Main branch API is preserved.
       * If API_BASE_URL is empty, this becomes /teachers.
       */
      const url = API_BASE_URL
        ? `${API_BASE_URL}/teachers`
        : "/api/teachers";

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(
          `Failed to fetch teachers: ${response.status}`
        );
      }

      const data = await response.json();

      /*
       * Support both API response formats:
       *
       * { success: true, teachers: [...] }
       *
       * OR
       *
       * [...]
       */
      if (Array.isArray(data)) {
        setTeachers(data);
      } else if (Array.isArray(data?.teachers)) {
        setTeachers(data.teachers);
      } else {
        setTeachers([]);
      }
    } catch (error) {
      console.error("Error fetching teachers:", error);
      setTeachers([]);
    } finally {
      setLoading(false);
    }
  };

  /* =========================================================
     INITIAL LOAD
  ========================================================= */

  useEffect(() => {
    fetchTeachers();

    return () => {
      mediaStreamRef.current
        ?.getTracks()
        ?.forEach((track) => track.stop());

      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        audioRef.current = null;
      }
    };
  }, []);

  /* =========================================================
     DYNAMIC TRANSLATION
  ========================================================= */

  useEffect(() => {
    if (!translateBulk) return;

    const dynamicTexts = {};

    teachers.forEach((teacher) => {
      const id =
        teacher.id ??
        teacher.teacher_id ??
        teacher.teacherId;

      const name =
        teacher.name ||
        teacher.full_name ||
        teacher.teacher_name;

      if (id && name) {
        dynamicTexts[`teacherName_${id}`] = name;
      }
    });

    translateBulk({
      ...teacherTexts,
      ...dynamicTexts,
    });
  }, [language, teachers]);

  /* =========================================================
     VOICE TO TEXT
  ========================================================= */

  const handleVoiceToText = async () => {
    if (isRecording) {
      mediaRecorderRef.current?.stop();
      return;
    }

    if (
      typeof navigator === "undefined" ||
      !navigator.mediaDevices ||
      !navigator.mediaDevices.getUserMedia
    ) {
      alert(t("microphonePermission"));
      return;
    }

    try {
      const stream =
        await navigator.mediaDevices.getUserMedia({
          audio: true,
        });

      mediaStreamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream);

      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        setIsRecording(false);

        try {
          const mimeType =
            mediaRecorder.mimeType || "audio/webm";

          const audioBlob = new Blob(
            audioChunksRef.current,
            {
              type: mimeType,
            }
          );

          let extension = "webm";

          if (mimeType.includes("ogg")) {
            extension = "ogg";
          } else if (mimeType.includes("mp4")) {
            extension = "mp4";
          } else if (mimeType.includes("wav")) {
            extension = "wav";
          }

          const audioFile = new File(
            [audioBlob],
            `recording.${extension}`,
            {
              type: mimeType,
            }
          );

          const audioFormData = new FormData();

          audioFormData.append(
            "file",
            audioFile
          );

          audioFormData.append(
            "language",
            "English"
          );

          audioFormData.append(
            "user_email",
            "admin@sss.edu"
          );

          audioFormData.append(
            "client_name",
            "SSS"
          );

          const response =
            await voiceToText(audioFormData);

          console.log(
            "VOICE TO TEXT RESPONSE:",
            response
          );

          const transcribedText =
            response?.text ||
            response?.transcription ||
            response?.transcribed_text;

          if (transcribedText) {
            setSearchTerm(transcribedText);
          } else {
            console.log(
              "Unexpected Voice-to-Text response:",
              response
            );

            alert(
              t("transcriptionNotReceived")
            );
          }
        } catch (error) {
          console.error(
            "Voice to Text failed:",
            error
          );

          alert(
            t("voiceToTextFailed")
          );
        } finally {
          mediaStreamRef.current
            ?.getTracks()
            ?.forEach((track) => track.stop());

          mediaStreamRef.current = null;
          mediaRecorderRef.current = null;
          audioChunksRef.current = [];
        }
      };

      mediaRecorder.start();

      setIsRecording(true);
    } catch (error) {
      console.error(
        "Microphone access failed:",
        error
      );

      alert(
        t("microphonePermission")
      );
    }
  };

  /* =========================================================
     TEXT TO VOICE
  ========================================================= */

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

    const teacher =
      selectedTeacherForVoice;

    const teacherName =
      teacher.name ||
      teacher.full_name ||
      teacher.teacher_name ||
      "not available";

    const subject =
      teacher.subject ||
      teacher.subject_name ||
      "not available";

    const qualification =
      teacher.qualification ||
      "not available";

    const classId =
      teacher.classId ||
      teacher.class_id ||
      "not assigned";

    const section =
      teacher.section1 ||
      teacher.section_1 ||
      teacher.section2 ||
      teacher.section_2 ||
      "not assigned";

    const isClassTeacher =
      teacher.isClassTeacher === "Y" ||
      teacher.is_class_teacher === true
        ? "Yes"
        : "No";

    const contact =
      teacher.contact ||
      teacher.phone ||
      "not available";

    const status =
      teacher.status ||
      (teacher.is_active === true
        ? "active"
        : "inactive");

    const text = [
      `Teacher name ${teacherName}.`,
      `Subject ${subject}.`,
      `Qualification ${qualification}.`,
      `Class ${classId}.`,
      `Section ${section}.`,
      `Class teacher ${isClassTeacher}.`,
      `Contact ${contact}.`,
      `Status ${status}.`,
    ].join(" ");

    try {
      const response =
        await textToVoice({
          text,
          language: "English",
          user_email: "admin@sss.edu",
          client_name: "SSS",
        });

      console.log(
        "TEXT TO VOICE RESPONSE:",
        response
      );

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
      console.error(
        "Teacher Text to Voice failed:",
        error
      );

      setIsPlaying(false);
      audioRef.current = null;

      alert(t("textToVoiceFailed"));
    }
  };

  /* =========================================================
     EMAIL VALIDATION
  ========================================================= */

  const validateEmail = (email) => {
    if (!email) return true;

    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
      email
    );
  };

  /* =========================================================
     FORM VALIDATION
  ========================================================= */

  const validateForm = () => {
    setValidationError("");

    if (!formData.teacher_id.trim()) {
      setValidationError(
        "Teacher ID is required"
      );
      return false;
    }

    if (
      !/^[TH]/i.test(
        formData.teacher_id.trim()
      )
    ) {
      setValidationError(
        'Teacher ID must start with "T" or "H"'
      );
      return false;
    }

    if (!formData.full_name.trim()) {
      setValidationError(
        "Teacher Name is required"
      );
      return false;
    }

    if (!formData.email_id.trim()) {
      setValidationError(
        "Email is required"
      );
      return false;
    }

    if (
      !validateEmail(
        formData.email_id.trim()
      )
    ) {
      setValidationError(
        "Please enter a valid email address"
      );
      return false;
    }

    return true;
  };

  /* =========================================================
     API HELPER
  ========================================================= */

  const getTeachersUrl = () => {
    return API_BASE_URL
      ? `${API_BASE_URL}/teachers`
      : "/api/teachers";
  };

  /* =========================================================
     ADD TEACHER
  ========================================================= */

  const handleAdd = async () => {
    if (!validateForm()) return;

    try {
      const response = await fetch(
        getTeachersUrl(),
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            teacher_id:
              formData.teacher_id.trim(),

            name:
              formData.full_name.trim(),

            subject:
              formData.subject_name.trim(),

            qualification:
              formData.qualification.trim(),

            class_id:
              formData.class_id.trim(),

            section_1:
              formData.section_1.trim(),

            section_2:
              formData.section_2.trim(),

            role:
              formData.role,

            is_class_teacher:
              formData.is_class_teacher,

            subjects:
              formData.subjects.trim(),

            contact:
              formData.phone.trim(),

            email:
              formData.email_id.trim(),

            status:
              formData.is_active
                ? "Active"
                : "Inactive",
          }),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "Failed to add teacher"
        );
      }

      await fetchTeachers();

      setIsModalOpen(false);

      resetForm();
    } catch (error) {
      console.error(
        "Error adding teacher:",
        error
      );

      setValidationError(
        error.message ||
          "Failed to add teacher"
      );
    }
  };

  /* =========================================================
     MODIFY TEACHER
  ========================================================= */

  const handleModify = async () => {
    if (!selectedTeacher) return;

    if (!validateForm()) return;

    try {
      /*
       * Main branch uses PUT /teachers.
       * Keep that API behavior.
       */
      const response = await fetch(
        getTeachersUrl(),
        {
          method: "PUT",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            teacher_id:
              formData.teacher_id.trim(),

            name:
              formData.full_name.trim(),

            subject:
              formData.subject_name.trim(),

            qualification:
              formData.qualification.trim(),

            class_id:
              formData.class_id.trim(),

            section_1:
              formData.section_1.trim(),

            section_2:
              formData.section_2.trim(),

            role:
              formData.role,

            is_class_teacher:
              formData.is_class_teacher,

            subjects:
              formData.subjects.trim(),

            contact:
              formData.phone.trim(),

            email:
              formData.email_id.trim(),

            status:
              formData.is_active
                ? "Active"
                : "Inactive",
          }),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "Failed to update teacher"
        );
      }

      await fetchTeachers();

      setIsModalOpen(false);

      resetForm();
    } catch (error) {
      console.error(
        "Error modifying teacher:",
        error
      );

      setValidationError(
        error.message ||
          "Failed to update teacher"
      );
    }
  };

  /* =========================================================
     DELETE TEACHER
  ========================================================= */

  const handleDelete = async (id) => {
    if (
      !window.confirm(
        t("deleteConfirmation") ||
          "Are you sure you want to delete this teacher?"
      )
    ) {
      return;
    }

    try {
      /*
       * Preserve main branch DELETE style:
       * /teachers?id=ID
       */
      const url =
        `${getTeachersUrl()}?id=${encodeURIComponent(
          id
        )}`;

      const response = await fetch(url, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data =
          await response.json().catch(
            () => ({})
          );

        throw new Error(
          data?.error ||
            "Failed to delete teacher"
        );
      }

      if (
        selectedTeacherForVoice &&
        String(
          selectedTeacherForVoice.id ||
            selectedTeacherForVoice.teacher_id
        ) === String(id)
      ) {
        setSelectedTeacherForVoice(null);
      }

      await fetchTeachers();
    } catch (error) {
      console.error(
        "Error deleting teacher:",
        error
      );

      alert(
        error.message ||
          "Failed to delete teacher"
      );
    }
  };

  /* =========================================================
     TOGGLE STATUS
  ========================================================= */

  const handleToggleStatus = async (id) => {
    const teacher =
      teachers.find(
        (item) =>
          String(
            item.id ||
              item.teacher_id
          ) === String(id)
      );

    if (!teacher) return;

    const currentActive =
      teacher.status === "Active" ||
      teacher.status === "active" ||
      teacher.is_active === true;

    const newStatus =
      currentActive
        ? "Inactive"
        : "Active";

    try {
      /*
       * Try PATCH first to preserve AI branch
       * status behavior.
       */
      const response = await fetch(
        `${getTeachersUrl()}/${encodeURIComponent(
          id
        )}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            status: newStatus,
          }),
        }
      );

      if (!response.ok) {
        console.warn(
          "PATCH status update failed."
        );
      }

      await fetchTeachers();
    } catch (error) {
      console.error(
        "Error toggling teacher status:",
        error
      );
    }
  };

  /* =========================================================
     RESET FORM
  ========================================================= */

  const resetForm = () => {
    setFormData({
      teacher_id: "",
      full_name: "",
      subject_name: "",
      qualification: "",
      class_id: "",
      section_1: "",
      section_2: "",
      role: "Teacher",
      is_class_teacher: false,
      subjects: "",
      phone: "",
      email_id: "",
      is_active: true,
    });

    setSelectedTeacher(null);
    setValidationError("");
  };

  /* =========================================================
     OPEN MODAL
  ========================================================= */

  const openModal = (
    type,
    teacher = null
  ) => {
    setModalType(type);
    setValidationError("");

    if (type === "add") {
      resetForm();

      /*
       * Generate next teacher ID.
       */
      const nextId =
        teachers.length + 1;

      setFormData((previous) => ({
        ...previous,
        teacher_id: `T${String(
          nextId
        ).padStart(3, "0")}`,
      }));
    }

    if (
      type === "modify" &&
      teacher
    ) {
      setSelectedTeacher(teacher);

      setFormData({
        teacher_id:
          teacher.id ||
          teacher.teacher_id ||
          "",

        full_name:
          teacher.name ||
          teacher.full_name ||
          "",

        subject_name:
          teacher.subject ||
          teacher.subject_name ||
          "",

        qualification:
          teacher.qualification ||
          "",

        class_id:
          teacher.classId ||
          teacher.class_id ||
          "",

        section_1:
          teacher.section1 ||
          teacher.section_1 ||
          "",

        section_2:
          teacher.section2 ||
          teacher.section_2 ||
          "",

        role:
          teacher.role ||
          "Teacher",

        is_class_teacher:
          teacher.isClassTeacher === "Y" ||
          teacher.is_class_teacher === true,

        subjects:
          teacher.subjects ||
          "",

        phone:
          teacher.contact ||
          teacher.phone ||
          "",

        email_id:
          teacher.email ||
          teacher.email_id ||
          "",

        is_active:
          teacher.status === "Active" ||
          teacher.status === "active" ||
          teacher.is_active === true,
      });
    }

    setIsModalOpen(true);
  };

  /* =========================================================
     FILTER
  ========================================================= */

  const filteredTeachers =
    Array.isArray(teachers)
      ? teachers.filter(
          (teacher) => {
            const term =
              searchTerm
                .toLowerCase()
                .trim();

            const id = String(
              teacher.id ||
                teacher.teacher_id ||
                ""
            ).toLowerCase();

            const name =
              (
                teacher.name ||
                teacher.full_name ||
                ""
              ).toLowerCase();

            const subject =
              (
                teacher.subject ||
                teacher.subject_name ||
                ""
              ).toLowerCase();

            if (!term) return true;

            if (searchType === "id") {
              return id.includes(term);
            }

            if (
              searchType === "subject"
            ) {
              return subject.includes(
                term
              );
            }

            return name.includes(term);
          }
        )
      : [];

  /* =========================================================
     STATS
  ========================================================= */

  const totalTeachers =
    teachers.length;

  const activeTeachers =
    teachers.filter(
      (teacher) =>
        teacher.status ===
          "Active" ||
        teacher.status ===
          "active" ||
        teacher.is_active === true
    ).length;

  const inactiveTeachers =
    teachers.filter(
      (teacher) =>
        teacher.status ===
          "Inactive" ||
        teacher.status ===
          "inactive" ||
        teacher.is_active === false
    ).length;

  /* =========================================================
     LOADING
  ========================================================= */

  if (
    loading &&
    teachers.length === 0
  ) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-white/60">
          {t("loadingTeachers") ||
            "Loading teachers..."}
        </div>
      </div>
    );
  }

  /* =========================================================
     UI
  ========================================================= */

  return (
    <div className="min-h-screen">
      {/* Translation Loader */}

      {translating &&
        language !== "English" && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="flex items-center gap-3 rounded-xl bg-slate-900 px-6 py-4 text-white shadow-2xl">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />

              <span className="font-medium">
                {t("translating") ||
                  "Translating"}{" "}
                {language}...
              </span>
            </div>
          </div>
        )}

      {/* Header */}

      <motion.div
        initial={{
          opacity: 0,
          y: -10,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        className="mb-8"
      >
        <h1 className="mb-2 flex items-center gap-3 text-4xl font-bold text-white">
          <BookOpen className="h-10 w-10 text-blue-400" />

          {t("pageTitle") ||
            "Teacher Management"}
        </h1>

        <p className="text-white/60">
          {t("pageSubtitle") ||
            "Manage all teachers, track their progress, and update records"}
        </p>
      </motion.div>

      {/* Stats */}

      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="rounded-2xl bg-gradient-to-r from-blue-500 to-cyan-500 p-6 shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white/80">
                {t("totalTeachers") ||
                  "Total Teachers"}
              </p>

              <p className="mt-2 text-4xl font-bold text-white">
                {totalTeachers}
              </p>

              <p className="mt-2 text-sm text-white/60">
                Enrolled this year
              </p>
            </div>

            <UsersIcon className="h-12 w-12 text-white/30" />
          </div>
        </div>

        <div className="rounded-2xl bg-gradient-to-r from-green-500 to-emerald-500 p-6 shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white/80">
                {t("activeTeachers") ||
                  "Active Teachers"}
              </p>

              <p className="mt-2 text-4xl font-bold text-white">
                {activeTeachers}
              </p>

              <p className="mt-2 text-sm text-white/60">
                Currently teaching
              </p>
            </div>

            <UserCheck className="h-12 w-12 text-white/30" />
          </div>
        </div>

        <div className="rounded-2xl bg-gradient-to-r from-orange-500 to-red-500 p-6 shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white/80">
                {t("inactiveTeachers") ||
                  "Inactive Teachers"}
              </p>

              <p className="mt-2 text-4xl font-bold text-white">
                {inactiveTeachers}
              </p>

              <p className="mt-2 text-sm text-white/60">
                Not currently teaching
              </p>
            </div>

            <UserX className="h-12 w-12 text-white/30" />
          </div>
        </div>
      </div>

      {/* Buttons */}

      <div className="mb-6 flex flex-wrap gap-4">
        <button
          onClick={() =>
            openModal("add")
          }
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-3 font-semibold text-white transition hover:shadow-lg"
        >
          <Plus size={20} />

          {t("addTeacher") ||
            "Add Teacher"}
        </button>

        <button
          onClick={() => {
            if (
              filteredTeachers.length ===
              1
            ) {
              openModal(
                "modify",
                filteredTeachers[0]
              );

              return;
            }

            const id = window.prompt(
              t("enterTeacherId") ||
                "Enter Teacher ID to modify:"
            );

            if (!id) return;

            const teacher =
              teachers.find(
                (item) =>
                  String(
                    item.id ||
                      item.teacher_id
                  ).toLowerCase() ===
                  String(
                    id
                  ).toLowerCase()
              );

            if (teacher) {
              openModal(
                "modify",
                teacher
              );
            } else {
              alert(
                t("teacherNotFound") ||
                  "Teacher not found!"
              );
            }
          }}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-3 font-semibold text-white transition hover:shadow-lg"
        >
          <Pencil size={20} />

          {t("modifyTeacher") ||
            "Modify Teacher"}
        </button>
      </div>

      {/* Search */}

      <div className="mb-4 flex flex-wrap gap-4">
        <div className="relative min-w-[200px] flex-1">
          <input
            type="text"
            placeholder={
              t("search") ||
              "Search..."
            }
            value={searchTerm}
            onChange={(event) =>
              setSearchTerm(
                event.target.value
              )
            }
            className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 pr-16 text-white placeholder-white/40 focus:border-white/40 focus:outline-none"
          />

          <button
            type="button"
            onClick={
              handleVoiceToText
            }
            title={
              isRecording
                ? t(
                    "stopRecording"
                  ) ||
                  "Stop recording"
                : t(
                    "startRecording"
                  ) ||
                  "Start voice search"
            }
            className={`absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full transition ${
              isRecording
                ? "animate-pulse bg-red-500 text-white"
                : "bg-white/10 text-white hover:bg-white/20"
            }`}
          >
            <Mic
              size={22}
              strokeWidth={2.3}
            />
          </button>
        </div>

        <select
          value={searchType}
          onChange={(event) =>
            setSearchType(
              event.target.value
            )
          }
          className="rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white focus:border-white/40 focus:outline-none"
        >
          <option
            value="name"
            className="text-black"
          >
            {t("searchByName") ||
              "Search by Name"}
          </option>

          <option
            value="id"
            className="text-black"
          >
            {t("searchById") ||
              "Search by ID"}
          </option>

          <option
            value="subject"
            className="text-black"
          >
            {t("searchBySubject") ||
              "Search by Subject"}
          </option>
        </select>
      </div>

      {/* Text To Voice */}

      <div className="mb-6 flex justify-end">
        <button
          type="button"
          onClick={
            handleTextToVoice
          }
          disabled={
            !selectedTeacherForVoice &&
            !isPlaying
          }
          title={
            isPlaying
              ? t("stopAudio") ||
                "Stop audio"
              : selectedTeacherForVoice
              ? `${
                  t(
                    "listenSelectedTeacher"
                  ) ||
                  "Listen to selected teacher"
                }: ${
                  translations?.[
                    `teacherName_${String(
                      selectedTeacherForVoice.id ||
                        selectedTeacherForVoice.teacher_id
                    )}`
                  ] ||
                  selectedTeacherForVoice.name ||
                  selectedTeacherForVoice.full_name
                }`
              : t(
                  "selectTeacherFirst"
                ) ||
                "Select a teacher first"
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
            ? t("stop") || "Stop"
            : selectedTeacherForVoice
            ? t(
                "listenSelectedTeacher"
              ) ||
              "Listen Selected Teacher"
            : t(
                "selectTeacher"
              ) ||
              "Select Teacher"}
        </button>
      </div>

      {/* Table */}

      <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1200px]">
            <thead className="bg-white/10">
              <tr>
                <th className="px-4 py-4 text-left text-white">
                  {t("id") || "ID"}
                </th>

                <th className="px-4 py-4 text-left text-white">
                  {t("name") ||
                    "Name"}
                </th>

                <th className="px-4 py-4 text-left text-white">
                  {t("subject") ||
                    "Subject"}
                </th>

                <th className="px-4 py-4 text-left text-white">
                  {t("qualification") ||
                    "Qualification"}
                </th>

                <th className="px-4 py-4 text-left text-white">
                  {t("classId") ||
                    "Class"}
                </th>

                <th className="px-4 py-4 text-left text-white">
                  {t("section") ||
                    "Section 1"}
                </th>

                <th className="px-4 py-4 text-left text-white">
                  Section 2
                </th>

                <th className="px-4 py-4 text-left text-white">
                  {t("role") ||
                    "Role"}
                </th>

                <th className="px-4 py-4 text-left text-white">
                  {t("contact") ||
                    "Phone"}
                </th>

                <th className="px-4 py-4 text-left text-white">
                  {t("email") ||
                    "Email"}
                </th>

                <th className="px-4 py-4 text-left text-white">
                  {t("status") ||
                    "Status"}
                </th>

                <th className="px-4 py-4 text-left text-white">
                  {t("actions") ||
                    "Actions"}
                </th>
              </tr>
            </thead>

            <tbody>
              {filteredTeachers.length ===
              0 ? (
                <tr>
                  <td
                    colSpan={12}
                    className="py-8 text-center text-white/60"
                  >
                    {searchTerm
                      ? "No teachers match your search"
                      : "No teachers found"}
                  </td>
                </tr>
              ) : (
                filteredTeachers.map(
                  (
                    teacher,
                    index
                  ) => {
                    const teacherId =
                      teacher.id ||
                      teacher.teacher_id ||
                      index;

                    const teacherName =
                      teacher.name ||
                      teacher.full_name ||
                      "-";

                    const subject =
                      teacher.subject ||
                      teacher.subject_name ||
                      "-";

                    const classId =
                      teacher.classId ||
                      teacher.class_id ||
                      "-";

                    const section1 =
                      teacher.section1 ||
                      teacher.section_1 ||
                      "-";

                    const section2 =
                      teacher.section2 ||
                      teacher.section_2 ||
                      "-";

                    const contact =
                      teacher.contact ||
                      teacher.phone ||
                      "-";

                    const email =
                      teacher.email ||
                      teacher.email_id ||
                      "-";

                    const active =
                      teacher.status ===
                        "Active" ||
                      teacher.status ===
                        "active" ||
                      teacher.is_active ===
                        true;

                    const translatedName =
                      translations?.[
                        `teacherName_${String(
                          teacherId
                        )}`
                      ] ||
                      teacherName;

                    const isSelected =
                      selectedTeacherForVoice &&
                      String(
                        selectedTeacherForVoice.id ||
                          selectedTeacherForVoice.teacher_id
                      ) ===
                        String(
                          teacherId
                        );

                    return (
                      <tr
                        key={String(
                          teacherId
                        )}
                        onClick={() =>
                          setSelectedTeacherForVoice(
                            teacher
                          )
                        }
                        className={`cursor-pointer border-t transition ${
                          isSelected
                            ? "border-purple-500 bg-purple-500/10"
                            : "border-white/10 hover:bg-white/5"
                        }`}
                      >
                        <td className="px-4 py-4 text-white/80">
                          {teacherId}
                        </td>

                        <td className="px-4 py-4 font-medium text-white">
                          {
                            translatedName
                          }
                        </td>

                        <td className="px-4 py-4 text-white/80">
                          {subject}
                        </td>

                        <td className="px-4 py-4 text-white/80">
                          {teacher.qualification ||
                            "-"}
                        </td>

                        <td className="px-4 py-4 text-white/80">
                          {classId}
                        </td>

                        <td className="px-4 py-4 text-white/80">
                          {section1}
                        </td>

                        <td className="px-4 py-4 text-white/80">
                          {section2}
                        </td>

                        <td className="px-4 py-4 text-white/80">
                          {teacher.role ||
                            "Teacher"}
                        </td>

                        <td className="px-4 py-4 text-white/80">
                          {contact}
                        </td>

                        <td className="px-4 py-4 text-white/80">
                          {email}
                        </td>

                        <td className="px-4 py-4">
                          <button
                            onClick={(
                              event
                            ) => {
                              event.stopPropagation();

                              handleToggleStatus(
                                teacherId
                              );
                            }}
                            className={`rounded-full px-3 py-1 text-sm font-semibold ${
                              active
                                ? "bg-green-500/20 text-green-400"
                                : "bg-red-500/20 text-red-400"
                            }`}
                          >
                            {active
                              ? t(
                                  "active"
                                ) ||
                                "Active"
                              : t(
                                  "inactive"
                                ) ||
                                "Inactive"}
                          </button>
                        </td>

                        <td className="px-4 py-4">
                          <div className="flex gap-2">
                            <button
                              onClick={(
                                event
                              ) => {
                                event.stopPropagation();

                                openModal(
                                  "modify",
                                  teacher
                                );
                              }}
                              className="rounded-lg p-2 text-blue-400 hover:bg-blue-500/20"
                              title="Modify"
                            >
                              <Pencil
                                size={
                                  16
                                }
                              />
                            </button>

                            <button
                              onClick={(
                                event
                              ) => {
                                event.stopPropagation();

                                handleDelete(
                                  teacherId
                                );
                              }}
                              className="rounded-lg p-2 text-red-400 hover:bg-red-500/20"
                              title="Delete"
                            >
                              <Trash2
                                size={
                                  16
                                }
                              />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  }
                )
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* =====================================================
          ADD / MODIFY MODAL
      ===================================================== */}

      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{
              opacity: 0,
            }}
            animate={{
              opacity: 1,
            }}
            exit={{
              opacity: 0,
            }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-md"
            onClick={() => {
              setIsModalOpen(false);
              resetForm();
            }}
          >
            <motion.div
              initial={{
                scale: 0.9,
                opacity: 0,
              }}
              animate={{
                scale: 1,
                opacity: 1,
              }}
              exit={{
                scale: 0.9,
                opacity: 0,
              }}
              onClick={(event) =>
                event.stopPropagation()
              }
              className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-white/20 bg-gradient-to-br from-slate-800 to-slate-900 p-8"
            >
              {/* Modal Header */}

              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white">
                  {modalType ===
                  "add"
                    ? t(
                        "addNewTeacher"
                      ) ||
                      "Add New Teacher"
                    : t(
                        "modifyTeacher"
                      ) ||
                      "Modify Teacher"}
                </h2>

                <button
                  onClick={() => {
                    setIsModalOpen(
                      false
                    );
                    resetForm();
                  }}
                  className="text-white/40 transition hover:text-white"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Validation Error */}

              {validationError && (
                <div className="mb-4 rounded-xl border border-red-500/50 bg-red-500/20 p-3 text-center text-sm text-red-400">
                  {validationError}
                </div>
              )}

              {/* Form */}

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {/* Teacher ID */}

                <div>
                  <label className="mb-1 block text-sm text-white/70">
                    Teacher ID *
                  </label>

                  <input
                    type="text"
                    placeholder="e.g. T001"
                    value={
                      formData.teacher_id
                    }
                    onChange={(event) =>
                      setFormData({
                        ...formData,
                        teacher_id:
                          event.target
                            .value,
                      })
                    }
                    className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white placeholder-white/40 focus:border-white/40 focus:outline-none"
                  />
                </div>

                {/* Name */}

                <div>
                  <label className="mb-1 block text-sm text-white/70">
                    {t(
                      "teacherName"
                    ) ||
                      "Teacher Name"}{" "}
                    *
                  </label>

                  <input
                    type="text"
                    placeholder="Enter teacher name"
                    value={
                      formData.full_name
                    }
                    onChange={(event) =>
                      setFormData({
                        ...formData,
                        full_name:
                          event.target
                            .value,
                      })
                    }
                    className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white placeholder-white/40 focus:border-white/40 focus:outline-none"
                  />
                </div>

                {/* Subject */}

                <div>
                  <label className="mb-1 block text-sm text-white/70">
                    {t("subject") ||
                      "Subject"}
                  </label>

                  <input
                    type="text"
                    placeholder="e.g. Mathematics"
                    value={
                      formData.subject_name
                    }
                    onChange={(event) =>
                      setFormData({
                        ...formData,
                        subject_name:
                          event.target
                            .value,
                      })
                    }
                    className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white placeholder-white/40 focus:border-white/40 focus:outline-none"
                  />
                </div>

                {/* Qualification */}

                <div>
                  <label className="mb-1 block text-sm text-white/70">
                    {t(
                      "qualification"
                    ) ||
                      "Qualification"}
                  </label>

                  <input
                    type="text"
                    placeholder="e.g. M.Sc, B.Ed"
                    value={
                      formData.qualification
                    }
                    onChange={(event) =>
                      setFormData({
                        ...formData,
                        qualification:
                          event.target
                            .value,
                      })
                    }
                    className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white placeholder-white/40 focus:border-white/40 focus:outline-none"
                  />
                </div>

                {/* Class */}

                <div>
                  <label className="mb-1 block text-sm text-white/70">
                    {t("classId") ||
                      "Class ID"}
                  </label>

                  <input
                    type="text"
                    placeholder="e.g. 13"
                    value={
                      formData.class_id
                    }
                    onChange={(event) =>
                      setFormData({
                        ...formData,
                        class_id:
                          event.target
                            .value,
                      })
                    }
                    className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white placeholder-white/40 focus:border-white/40 focus:outline-none"
                  />
                </div>

                {/* Section 1 */}

                <div>
                  <label className="mb-1 block text-sm text-white/70">
                    Section 1
                  </label>

                  <input
                    type="text"
                    placeholder="e.g. A"
                    value={
                      formData.section_1
                    }
                    onChange={(event) =>
                      setFormData({
                        ...formData,
                        section_1:
                          event.target
                            .value,
                      })
                    }
                    className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white placeholder-white/40 focus:border-white/40 focus:outline-none"
                  />
                </div>

                {/* Section 2 */}

                <div>
                  <label className="mb-1 block text-sm text-white/70">
                    Section 2
                  </label>

                  <input
                    type="text"
                    placeholder="e.g. B"
                    value={
                      formData.section_2
                    }
                    onChange={(event) =>
                      setFormData({
                        ...formData,
                        section_2:
                          event.target
                            .value,
                      })
                    }
                    className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white placeholder-white/40 focus:border-white/40 focus:outline-none"
                  />
                </div>

                {/* Subjects */}

                <div>
                  <label className="mb-1 block text-sm text-white/70">
                    Subjects
                  </label>

                  <input
                    type="text"
                    placeholder="Math, Science"
                    value={
                      formData.subjects
                    }
                    onChange={(event) =>
                      setFormData({
                        ...formData,
                        subjects:
                          event.target
                            .value,
                      })
                    }
                    className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white placeholder-white/40 focus:border-white/40 focus:outline-none"
                  />
                </div>

                {/* Phone */}

                <div>
                  <label className="mb-1 block text-sm text-white/70">
                    {t("contact") ||
                      "Contact Number"}
                  </label>

                  <input
                    type="tel"
                    placeholder="9876543210"
                    value={
                      formData.phone
                    }
                    onChange={(event) =>
                      setFormData({
                        ...formData,
                        phone:
                          event.target
                            .value,
                      })
                    }
                    className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white placeholder-white/40 focus:border-white/40 focus:outline-none"
                  />
                </div>

                {/* Email */}

                <div>
                  <label className="mb-1 block text-sm text-white/70">
                    Email *
                  </label>

                  <input
                    type="email"
                    placeholder="teacher@email.com"
                    value={
                      formData.email_id
                    }
                    onChange={(event) =>
                      setFormData({
                        ...formData,
                        email_id:
                          event.target
                            .value,
                      })
                    }
                    className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white placeholder-white/40 focus:border-white/40 focus:outline-none"
                  />
                </div>

                {/* Role */}

                <div>
                  <label className="mb-1 block text-sm text-white/70">
                    Role
                  </label>

                  <select
                    value={
                      formData.role
                    }
                    onChange={(event) =>
                      setFormData({
                        ...formData,
                        role:
                          event.target
                            .value,
                      })
                    }
                    className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white focus:outline-none"
                  >
                    <option
                      value="Teacher"
                      className="text-black"
                    >
                      Teacher
                    </option>

                    <option
                      value="Headmaster"
                      className="text-black"
                    >
                      Headmaster
                    </option>

                    <option
                      value="Class Teacher"
                      className="text-black"
                    >
                      Class Teacher
                    </option>
                  </select>
                </div>

                {/* Status */}

                <div>
                  <label className="mb-1 block text-sm text-white/70">
                    Status
                  </label>

                  <select
                    value={
                      formData.is_active
                        ? "Active"
                        : "Inactive"
                    }
                    onChange={(event) =>
                      setFormData({
                        ...formData,
                        is_active:
                          event.target
                            .value ===
                          "Active",
                      })
                    }
                    className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white focus:outline-none"
                  >
                    <option
                      value="Active"
                      className="text-black"
                    >
                      Active
                    </option>

                    <option
                      value="Inactive"
                      className="text-black"
                    >
                      Inactive
                    </option>
                  </select>
                </div>

                {/* Class Teacher */}

                <div className="flex items-center gap-3 md:col-span-2">
                  <input
                    id="classTeacher"
                    type="checkbox"
                    checked={
                      formData.is_class_teacher
                    }
                    onChange={(event) =>
                      setFormData({
                        ...formData,
                        is_class_teacher:
                          event.target
                            .checked,
                      })
                    }
                    className="h-5 w-5 accent-blue-500"
                  />

                  <label
                    htmlFor="classTeacher"
                    className="text-sm text-white/70"
                  >
                    {t(
                      "isClassTeacher"
                    ) ||
                      "Class Teacher"}
                  </label>
                </div>
              </div>

              {/* Modal Buttons */}

              <div className="mt-6 flex gap-3">
                <button
                  onClick={
                    modalType === "add"
                      ? handleAdd
                      : handleModify
                  }
                  className="flex-1 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 py-3 font-semibold text-white transition hover:shadow-lg"
                >
                  {modalType ===
                  "add"
                    ? t(
                        "addTeacher"
                      ) ||
                      "Add Teacher"
                    : t(
                        "saveChanges"
                      ) ||
                      "Save Changes"}
                </button>

                <button
                  onClick={() => {
                    setIsModalOpen(
                      false
                    );
                    resetForm();
                  }}
                  className="flex-1 rounded-xl bg-white/10 py-3 font-semibold text-white transition hover:bg-white/20"
                >
                  {t("cancel") ||
                    "Cancel"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}