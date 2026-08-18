"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

import {
  textToVoice,
  voiceToText,
} from "../../services/adminAIService";

import { studentTexts } from "./studentTexts";
import { useLanguage } from "../../context/LanguageContext";

import {
  Plus,
  Pencil,
  Trash2,
  X,
  Mic,
  Volume2,
  BookOpen,
  Users as UsersIcon,
  UserCheck,
  UserX,
} from "lucide-react";

import StudentFormWizard from "../../../components/StudentFormWizard";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "";

export default function StudentsPage() {
  /* ============================================================
     LANGUAGE / AI
  ============================================================ */

  const {
    language,
    translations,
    translateBulk,
    translating,
  } = useLanguage();

  const t = (key) =>
    translations?.[key] || studentTexts[key] || key;

  /* ============================================================
     STUDENTS
  ============================================================ */

  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  /* ============================================================
     SEARCH
  ============================================================ */

  const [searchTerm, setSearchTerm] = useState("");
  const [searchType, setSearchType] = useState("name");

  /* ============================================================
     PHOTO PREVIEW
  ============================================================ */

  const [selectedPhoto, setSelectedPhoto] = useState(null);

  /* ============================================================
     STUDENT FORM WIZARD
  ============================================================ */

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState("add");
  const [editingStudent, setEditingStudent] = useState(null);

  /* ============================================================
     VOICE TO TEXT
  ============================================================ */

  const [isRecording, setIsRecording] = useState(false);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const mediaStreamRef = useRef(null);

  /* ============================================================
     TEXT TO VOICE
  ============================================================ */

  const [
    selectedStudentForVoice,
    setSelectedStudentForVoice,
  ] = useState(null);

  const [isPlaying, setIsPlaying] = useState(false);

  const audioRef = useRef(null);

  /* ============================================================
     FETCH STUDENTS
  ============================================================ */

  const fetchStudents = async () => {
    try {
      setLoading(true);

      const response = await fetch(
        `${API_BASE_URL}/students`
      );

      if (!response.ok) {
        throw new Error(
          `Failed to fetch students: ${response.status}`
        );
      }

      const data = await response.json();

      console.log("Students API Response:", data);

      /*
       * Backend may return:
       *
       * 1. Array
       * 2. { success: true, students: [...] }
       */

      const studentsArray = Array.isArray(data)
        ? data
        : Array.isArray(data?.students)
        ? data.students
        : [];

      if (!studentsArray.length) {
        setStudents([]);
        return;
      }

      /* ========================================================
         MAP STUDENT DATA
      ======================================================== */

      const mappedStudents = studentsArray.map((s) => ({
        /* -------------------------------
           ID
        -------------------------------- */

        id:
          s.admission_no ||
          s.student_id ||
          s.id,

        student_id:
          s.student_id ||
          s.admission_no ||
          s.id,

        admission_no:
          s.admission_no ||
          s.student_id ||
          "",

        /* -------------------------------
           STUDENT
        -------------------------------- */

        name:
          s.full_name ||
          s.name ||
          "",

        full_name:
          s.full_name ||
          s.name ||
          "",

        class:
          s.class ||
          s.class_name ||
          s.class_id ||
          "",

        class_id:
          s.class_id || "",

        section:
          s.section || "",

        roll_no:
          s.roll_no || "",

        /* -------------------------------
           PARENT 1
        -------------------------------- */

        parent1_name:
          s.parent1_name || "",

        parent1_phone:
          s.parent1_phone || "",

        parent1_email:
          s.parent1_email || "",

        /* -------------------------------
           PARENT 2
        -------------------------------- */

        parent2_name:
          s.parent2_name || "",

        parent2_phone:
          s.parent2_phone || "",

        parent2_email:
          s.parent2_email || "",

        /* -------------------------------
           STUDENT CONTACT
        -------------------------------- */

        student_contact:
          s.student_phone ||
          s.student_contact ||
          "",

        student_phone:
          s.student_phone || "",

        student_email:
          s.student_email || "",

        /* -------------------------------
           GUARDIAN
        -------------------------------- */

        guardian_name:
          s.guardian_name || "",

        guardian_phone:
          s.guardian_phone || "",

        guardian_email:
          s.guardian_email || "",

        /* -------------------------------
           STATUS
        -------------------------------- */

        status:
          s.record_status === "Active"
            ? "Active"
            : s.status === "Active"
            ? "Active"
            : s.status === "active"
            ? "Active"
            : "Inactive",

        record_status:
          s.record_status || "Active",

        /* -------------------------------
           PHOTO KEYS
        -------------------------------- */

        student_photo_key:
          s.student_photo_key || null,

        parent1_photo_key:
          s.parent1_photo_key || null,

        parent2_photo_key:
          s.parent2_photo_key || null,

        guardian_photo_key:
          s.guardian_photo_key || null,

        /* -------------------------------
           PHOTO URLS
        -------------------------------- */

        photoUrl: null,
        parent1PhotoUrl: null,
        parent2PhotoUrl: null,
        guardianPhotoUrl: null,
      }));

      console.log(
        "Mapped Students:",
        mappedStudents
      );

      /*
       * Show student data immediately.
       */
      setStudents(mappedStudents);

      /* ========================================================
         FETCH ALL 4 PHOTOS FOR EACH STUDENT
      ======================================================== */

      const studentsWithPhotos =
        await Promise.all(
          mappedStudents.map(async (student) => {
            try {
              const admissionNo =
                student.admission_no;

              if (!admissionNo) {
                return student;
              }

              const [
                studentRes,
                parent1Res,
                parent2Res,
                guardianRes,
              ] = await Promise.all([
                fetch(
                  `${API_BASE_URL}/students/${encodeURIComponent(
                    admissionNo
                  )}/photo?photoType=student`
                ),

                fetch(
                  `${API_BASE_URL}/students/${encodeURIComponent(
                    admissionNo
                  )}/photo?photoType=parent1`
                ),

                fetch(
                  `${API_BASE_URL}/students/${encodeURIComponent(
                    admissionNo
                  )}/photo?photoType=parent2`
                ),

                fetch(
                  `${API_BASE_URL}/students/${encodeURIComponent(
                    admissionNo
                  )}/photo?photoType=guardian`
                ),
              ]);

              const [
                studentData,
                parent1Data,
                parent2Data,
                guardianData,
              ] = await Promise.all([
                studentRes.ok
                  ? studentRes.json()
                  : null,

                parent1Res.ok
                  ? parent1Res.json()
                  : null,

                parent2Res.ok
                  ? parent2Res.json()
                  : null,

                guardianRes.ok
                  ? guardianRes.json()
                  : null,
              ]);

              return {
                ...student,

                photoUrl:
                  studentData?.success
                    ? studentData.photoUrl
                    : null,

                parent1PhotoUrl:
                  parent1Data?.success
                    ? parent1Data.photoUrl
                    : null,

                parent2PhotoUrl:
                  parent2Data?.success
                    ? parent2Data.photoUrl
                    : null,

                guardianPhotoUrl:
                  guardianData?.success
                    ? guardianData.photoUrl
                    : null,
              };
            } catch (error) {
              console.error(
                `Photo fetch failed for ${student.admission_no}:`,
                error
              );

              return {
                ...student,
                photoUrl: null,
                parent1PhotoUrl: null,
                parent2PhotoUrl: null,
                guardianPhotoUrl: null,
              };
            }
          })
        );

      /*
       * Update students after photos are loaded.
       */
      setStudents(studentsWithPhotos);
    } catch (error) {
      console.error(
        "Error fetching students:",
        error
      );

      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  /* ============================================================
     INITIAL LOAD / CLEANUP
  ============================================================ */

  useEffect(() => {
    fetchStudents();

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

  /* ============================================================
     DYNAMIC STUDENT TRANSLATION
  ============================================================ */

  const getDynamicStudentTexts = () => {
    const dynamicTexts = {};

    students.forEach((student) => {
      if (student.name) {
        dynamicTexts[
          `studentName_${student.id}`
        ] = student.name;
      }

      if (student.parent1_name) {
        dynamicTexts[
          `parentName_${student.id}`
        ] = student.parent1_name;
      }

      if (student.guardian_name) {
        dynamicTexts[
          `guardianName_${student.id}`
        ] = student.guardian_name;
      }
    });

    return dynamicTexts;
  };

  /* ============================================================
     BULK TRANSLATION
  ============================================================ */

  useEffect(() => {
    if (!students.length) return;

    const dynamicTexts =
      getDynamicStudentTexts();

    const allTexts = {
      ...studentTexts,
      ...dynamicTexts,
    };

    translateBulk(allTexts);
  }, [language, students]);

  /* ============================================================
     VOICE TO TEXT
  ============================================================ */

  const handleVoiceToText = async () => {
    /*
     * Stop recording if already recording.
     */

    if (isRecording) {
      mediaRecorderRef.current?.stop();
      return;
    }

    try {
      if (
        !navigator.mediaDevices ||
        !navigator.mediaDevices.getUserMedia
      ) {
        alert(
          t("allowMicrophone") ||
            "Please allow microphone access."
        );

        return;
      }

      const stream =
        await navigator.mediaDevices.getUserMedia({
          audio: true,
        });

      mediaStreamRef.current = stream;

      const mediaRecorder =
        new MediaRecorder(stream);

      mediaRecorderRef.current =
        mediaRecorder;

      audioChunksRef.current = [];

      mediaRecorder.ondataavailable =
        (event) => {
          if (
            event.data &&
            event.data.size > 0
          ) {
            audioChunksRef.current.push(
              event.data
            );
          }
        };

      mediaRecorder.onstop = async () => {
        setIsRecording(false);

        try {
          const mimeType =
            mediaRecorder.mimeType ||
            "audio/webm";

          const audioBlob = new Blob(
            audioChunksRef.current,
            {
              type: mimeType,
            }
          );

          const extension =
            mimeType.includes("ogg")
              ? "ogg"
              : mimeType.includes("mp4")
              ? "mp4"
              : "webm";

          const audioFile = new File(
            [audioBlob],
            `recording.${extension}`,
            {
              type: mimeType,
            }
          );

          const voiceFormData =
            new FormData();

          voiceFormData.append(
            "file",
            audioFile
          );

          voiceFormData.append(
            "language",
            "English"
          );

          voiceFormData.append(
            "user_email",
            "admin@sss.edu"
          );

          voiceFormData.append(
            "client_name",
            "SSS"
          );

          const response =
            await voiceToText(
              voiceFormData
            );

          const transcribedText =
            response?.text ||
            response?.transcription ||
            response?.transcribed_text ||
            "";

          if (transcribedText.trim()) {
            setSearchTerm(
              transcribedText.trim()
            );
          } else {
            alert(
              t("transcriptionNotReceived") ||
                "Transcription was not received."
            );
          }
        } catch (error) {
          console.error(
            "Voice to Text failed:",
            error
          );

          alert(
            t("voiceToTextFailed") ||
              "Voice to text failed."
          );
        } finally {
          mediaStreamRef.current
            ?.getTracks()
            .forEach((track) =>
              track.stop()
            );

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

      setIsRecording(false);

      alert(
        t("allowMicrophone") ||
          "Please allow microphone access."
      );
    }
  };

  /* ============================================================
     TEXT TO VOICE
  ============================================================ */

  const handleTextToVoice = async () => {
    /*
     * Stop current audio.
     */

    if (
      isPlaying &&
      audioRef.current
    ) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
      setIsPlaying(false);

      return;
    }

    if (!selectedStudentForVoice) {
      alert(
        t("selectStudentFirst") ||
          "Please select a student first."
      );

      return;
    }

    const student =
      selectedStudentForVoice;

    const text = [
      `Student name ${
        student.name ||
        "not available"
      }.`,

      `Admission number ${
        student.admission_no ||
        "not available"
      }.`,

      `Class ${
        student.class ||
        "not assigned"
      }.`,

      `Section ${
        student.section ||
        "not assigned"
      }.`,

      `Roll number ${
        student.roll_no ||
        "not available"
      }.`,

      `Parent 1 name ${
        student.parent1_name ||
        "not available"
      }.`,

      `Parent 1 phone ${
        student.parent1_phone ||
        "not available"
      }.`,

      `Parent 1 email ${
        student.parent1_email ||
        "not available"
      }.`,

      `Parent 2 name ${
        student.parent2_name ||
        "not available"
      }.`,

      `Parent 2 phone ${
        student.parent2_phone ||
        "not available"
      }.`,

      `Parent 2 email ${
        student.parent2_email ||
        "not available"
      }.`,

      `Student contact ${
        student.student_phone ||
        student.student_contact ||
        "not available"
      }.`,

      `Student email ${
        student.student_email ||
        "not available"
      }.`,

      `Guardian name ${
        student.guardian_name ||
        "not available"
      }.`,

      `Guardian phone ${
        student.guardian_phone ||
        "not available"
      }.`,

      `Guardian email ${
        student.guardian_email ||
        "not available"
      }.`,

      `Status ${
        student.status ||
        "not available"
      }.`,
    ].join(" ");

    try {
      const response =
        await textToVoice({
          text,
          language: "English",
          user_email:
            "admin@sss.edu",
          client_name: "SSS",
        });

      if (!response?.audio_base64) {
        alert(
          t("audioNotReceived") ||
            "Audio was not received."
        );

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
        "Student Text to Voice failed:",
        error
      );

      setIsPlaying(false);
      audioRef.current = null;

      alert(
        t("textToVoiceFailed") ||
          "Text to voice failed."
      );
    }
  };

  /* ============================================================
     DELETE STUDENT
  ============================================================ */

  const handleDelete = async (student) => {
    const id =
      student?.admission_no ||
      student?.student_id ||
      student?.id;

    if (!id) {
      alert(
        t("studentIdNotFound") ||
          "Student ID not found."
      );

      return;
    }

    if (
      !confirm(
        t("deleteConfirmation") ||
          "Are you sure you want to delete this student?"
      )
    ) {
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/students?id=${encodeURIComponent(
          id
        )}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        const errorData =
          await response
            .json()
            .catch(() => ({}));

        alert(
          errorData?.error ||
            t("errorDeletingStudent") ||
            "Failed to delete student."
        );

        return;
      }

      await fetchStudents();
    } catch (error) {
      console.error(
        "Error deleting student:",
        error
      );

      alert(
        t("errorDeletingStudent") ||
          "Failed to delete student."
      );
    }
  };

  /* ============================================================
     TOGGLE ACTIVE / INACTIVE
  ============================================================ */

  const handleToggleStatus = async (
    student
  ) => {
    const newStatus =
      student.status === "Active"
        ? "Inactive"
        : "Active";

    try {
      const response = await fetch(
        `${API_BASE_URL}/students`,
        {
          method: "PUT",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            ...student,
            admission_no:
              student.admission_no,
            status: newStatus,
          }),
        }
      );

      if (!response.ok) {
        const errorData =
          await response
            .json()
            .catch(() => ({}));

        alert(
          errorData?.error ||
            t("errorUpdatingStatus") ||
            "Failed to update student status."
        );

        return;
      }

      await fetchStudents();
    } catch (error) {
      console.error(
        "Error updating status:",
        error
      );

      alert(
        t("errorUpdatingStatus") ||
          "Failed to update student status."
      );
    }
  };

  /* ============================================================
     OPEN ADD / MODIFY WIZARD
  ============================================================ */

  const openModal = (
    type,
    student = null
  ) => {
    setModalType(type);

    if (type === "add") {
      setEditingStudent(null);
    } else {
      setEditingStudent(student);
    }

    setIsModalOpen(true);
  };

  /* ============================================================
     MODIFY BY PROMPT
  ============================================================ */

  const handleModifyByPrompt = () => {
    /*
     * If exactly one filtered student exists,
     * modify that student directly.
     */

    if (filteredStudents.length === 1) {
      openModal(
        "modify",
        filteredStudents[0]
      );

      return;
    }

    const id = prompt(
      t("enterStudentId") ||
        "Enter Admission Number or Student ID to modify:"
    );

    if (!id) {
      return;
    }

    const searchId =
      id.trim().toLowerCase();

    const student = students.find(
      (s) =>
        String(
          s.admission_no || ""
        ).toLowerCase() === searchId ||
        String(
          s.student_id || ""
        ).toLowerCase() === searchId ||
        String(
          s.id || ""
        ).toLowerCase() === searchId
    );

    if (student) {
      openModal(
        "modify",
        student
      );
    } else {
      alert(
        t("studentNotFound") ||
          "Student not found!"
      );
    }
  };

  /* ============================================================
     WIZARD SUCCESS
  ============================================================ */

  const handleWizardSuccess =
    async () => {
      await fetchStudents();
    };

  /* ============================================================
     WIZARD CLOSE
  ============================================================ */

  const handleWizardClose = () => {
    setIsModalOpen(false);
    setEditingStudent(null);
    setModalType("add");
  };

  /* ============================================================
     FILTERED STUDENTS
  ============================================================ */

  const filteredStudents =
    Array.isArray(students)
      ? students.filter((student) => {
          const term =
            searchTerm
              .toLowerCase()
              .trim();

          if (!term) {
            return true;
          }

          if (
            searchType === "name"
          ) {
            const nameStr =
              String(
                student.name ||
                  student.full_name ||
                  ""
              ).toLowerCase();

            return nameStr.includes(
              term
            );
          }

          if (
            searchType === "id"
          ) {
            const admissionNo =
              String(
                student.admission_no ||
                  ""
              ).toLowerCase();

            const studentId =
              String(
                student.student_id ||
                  ""
              ).toLowerCase();

            const id =
              String(
                student.id || ""
              ).toLowerCase();

            return (
              admissionNo.includes(
                term
              ) ||
              studentId.includes(
                term
              ) ||
              id.includes(term)
            );
          }

          if (
            searchType === "class"
          ) {
            return String(
              student.class || ""
            )
              .toLowerCase()
              .includes(term);
          }

          if (
            searchType === "section"
          ) {
            return String(
              student.section || ""
            )
              .toLowerCase()
              .includes(term);
          }

          return true;
        })
      : [];

  /* ============================================================
     STATISTICS
  ============================================================ */

  const stats = {
    total: Array.isArray(students)
      ? students.length
      : 0,

    active: Array.isArray(students)
      ? students.filter(
          (student) =>
            student.status ===
            "Active"
        ).length
      : 0,

    inactive: Array.isArray(students)
      ? students.filter(
          (student) =>
            student.status ===
            "Inactive"
        ).length
      : 0,
  };

  /* ============================================================
     PHOTO CELL
  ============================================================ */

  const PhotoCell = ({
    photoUrl,
    alt,
  }) => {
    return (
      <td className="px-4 py-4">
        {photoUrl ? (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              setSelectedPhoto(
                photoUrl
              );
            }}
            className="focus:outline-none"
            title={`View ${alt}`}
          >
            <img
              src={photoUrl}
              alt={alt}
              className="w-12 h-12 rounded-full object-cover border border-white/20 hover:scale-110 transition cursor-pointer"
            />
          </button>
        ) : (
          <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white/40">
            -
          </div>
        )}
      </td>
    );
  };

  /* ============================================================
     LOADING
  ============================================================ */

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex justify-center items-center">
        <div className="text-white/60">
          {t("loadingStudents") ||
            "Loading students..."}
        </div>
      </div>
    );
  }

  /* ============================================================
     UI
  ============================================================ */

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-6">
      <div className="max-w-[1800px] mx-auto">

        {/* ======================================================
            TRANSLATION OVERLAY
        ====================================================== */}

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

        {/* ======================================================
            HEADER
        ====================================================== */}

        <motion.div
          className="mb-8"
          initial={{
            opacity: 0,
            y: -10,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
        >
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
            <BookOpen className="w-10 h-10 text-blue-400" />

            {t("pageTitle") ||
              "Student Management"}
          </h1>

          <p className="text-white/60">
            {t("pageSubtitle") ||
              "Manage all students, track their progress, and update records"}
          </p>
        </motion.div>

        {/* ======================================================
            STATISTICS
        ====================================================== */}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">

          {/* TOTAL */}

          <div className="bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/80 text-sm">
                  {t("totalStudents") ||
                    "Total Students"}
                </p>

                <p className="text-white text-4xl font-bold mt-2">
                  {stats.total}
                </p>

                <p className="text-white/60 text-sm mt-2">
                  Enrolled students
                </p>
              </div>

              <UsersIcon className="w-12 h-12 text-white/30" />
            </div>
          </div>

          {/* ACTIVE */}

          <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/80 text-sm">
                  {t("activeStudents") ||
                    "Active Students"}
                </p>

                <p className="text-white text-4xl font-bold mt-2">
                  {stats.active}
                </p>

                <p className="text-white/60 text-sm mt-2">
                  Currently attending
                </p>
              </div>

              <UserCheck className="w-12 h-12 text-white/30" />
            </div>
          </div>

          {/* INACTIVE */}

          <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/80 text-sm">
                  {t("inactiveStudents") ||
                    "Inactive Students"}
                </p>

                <p className="text-white text-4xl font-bold mt-2">
                  {stats.inactive}
                </p>

                <p className="text-white/60 text-sm mt-2">
                  Not currently enrolled
                </p>
              </div>

              <UserX className="w-12 h-12 text-white/30" />
            </div>
          </div>
        </div>

        {/* ======================================================
            ACTION BUTTONS
        ====================================================== */}

        <div className="flex flex-wrap gap-4 mb-6">

          {/* ADD */}

          <button
            onClick={() =>
              openModal("add")
            }
            className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-semibold flex items-center gap-2 hover:shadow-lg transition"
          >
            <Plus size={20} />

            {t("addStudent") ||
              "Add Student"}
          </button>

          {/* MODIFY */}

          <button
            onClick={
              handleModifyByPrompt
            }
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-semibold flex items-center gap-2 hover:shadow-lg transition"
          >
            <Pencil size={20} />

            {t("modifyStudent") ||
              "Modify Student"}
          </button>
        </div>

        {/* ======================================================
            SEARCH
        ====================================================== */}

        <div className="flex flex-wrap gap-4 mb-4">

          <div className="flex-1 min-w-[250px] relative">

            <input
              type="text"
              placeholder={
                t("search") ||
                "Search by name, ID, class, or section..."
              }
              value={searchTerm}
              onChange={(event) =>
                setSearchTerm(
                  event.target.value
                )
              }
              className="w-full px-4 py-3 pr-16 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-white/40"
            />

            {/* VOICE SEARCH */}

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
              className={`absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full transition flex items-center justify-center ${
                isRecording
                  ? "bg-red-500 text-white animate-pulse"
                  : "bg-white/10 hover:bg-white/20 text-white"
              }`}
            >
              <Mic
                size={22}
                strokeWidth={2.3}
              />
            </button>
          </div>

          {/* SEARCH TYPE */}

          <select
            value={searchType}
            onChange={(event) =>
              setSearchType(
                event.target.value
              )
            }
            className="px-4 py-3 bg-slate-800 border border-white/20 rounded-xl text-white focus:outline-none focus:border-white/40"
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
              value="class"
              className="text-black"
            >
              {t("searchByClass") ||
                "Search by Class"}
            </option>

            <option
              value="section"
              className="text-black"
            >
              {t("searchBySection") ||
                "Search by Section"}
            </option>
          </select>
        </div>

        {/* ======================================================
            TEXT TO VOICE
        ====================================================== */}

        <div className="flex justify-end mb-6">
          <button
            type="button"
            onClick={
              handleTextToVoice
            }
            disabled={
              !selectedStudentForVoice &&
              !isPlaying
            }
            title={
              isPlaying
                ? t("stopAudio") ||
                  "Stop audio"
                : selectedStudentForVoice
                ? `${
                    t(
                      "listenSelectedStudent"
                    ) ||
                    "Listen"
                  }: ${
                    translations?.[
                      `studentName_${selectedStudentForVoice.id}`
                    ] ||
                    selectedStudentForVoice.name
                  }`
                : t(
                    "selectStudentFirst"
                  ) ||
                  "Select a student first"
            }
            className={`flex items-center gap-2 rounded-xl px-4 py-2 font-medium transition ${
              isPlaying
                ? "bg-red-500 text-white hover:bg-red-600"
                : selectedStudentForVoice
                ? "bg-purple-600 text-white hover:bg-purple-700"
                : "cursor-not-allowed bg-white/10 text-white/40"
            }`}
          >
            <Volume2 size={20} />

            {isPlaying
              ? t("stop") ||
                "Stop"
              : selectedStudentForVoice
              ? t(
                  "listenSelectedStudent"
                ) ||
                "Listen"
              : t("selectStudent") ||
                "Select Student"}
          </button>
        </div>

        {/* ======================================================
            STUDENT TABLE
        ====================================================== */}

        <div className="bg-white/5 backdrop-blur-xl rounded-2xl overflow-hidden border border-white/10 shadow-xl">

          <div className="overflow-x-auto">

            <table className="w-full min-w-[2100px]">

              {/* TABLE HEADER */}

              <thead className="bg-white/10">

                <tr>

                  <th className="px-4 py-4 text-left text-white text-sm">
                    ID
                  </th>

                  <th className="px-4 py-4 text-left text-white text-sm">
                    {t("admissionNo") ||
                      "Admission No"}
                  </th>

                  <th className="px-4 py-4 text-left text-white text-sm">
                    {t("name") ||
                      "Name"}
                  </th>

                  <th className="px-4 py-4 text-left text-white text-sm">
                    Student Photo
                  </th>

                  <th className="px-4 py-4 text-left text-white text-sm">
                    {t("class") ||
                      "Class"}
                  </th>

                  <th className="px-4 py-4 text-left text-white text-sm">
                    {t("section") ||
                      "Section"}
                  </th>

                  <th className="px-4 py-4 text-left text-white text-sm">
                    {t("rollNo") ||
                      "Roll No"}
                  </th>

                  <th className="px-4 py-4 text-left text-white text-sm">
                    Parent 1 Name
                  </th>

                  <th className="px-4 py-4 text-left text-white text-sm">
                    Parent 1 Photo
                  </th>

                  <th className="px-4 py-4 text-left text-white text-sm">
                    Parent 1 Phone
                  </th>

                  <th className="px-4 py-4 text-left text-white text-sm">
                    Parent 1 Email
                  </th>

                  <th className="px-4 py-4 text-left text-white text-sm">
                    Parent 2 Name
                  </th>

                  <th className="px-4 py-4 text-left text-white text-sm">
                    Parent 2 Photo
                  </th>

                  <th className="px-4 py-4 text-left text-white text-sm">
                    Parent 2 Phone
                  </th>

                  <th className="px-4 py-4 text-left text-white text-sm">
                    Parent 2 Email
                  </th>

                  <th className="px-4 py-4 text-left text-white text-sm">
                    Student Contact
                  </th>

                  <th className="px-4 py-4 text-left text-white text-sm">
                    Student Email
                  </th>

                  <th className="px-4 py-4 text-left text-white text-sm">
                    Guardian Name
                  </th>

                  <th className="px-4 py-4 text-left text-white text-sm">
                    Guardian Photo
                  </th>

                  <th className="px-4 py-4 text-left text-white text-sm">
                    Guardian Phone
                  </th>

                  <th className="px-4 py-4 text-left text-white text-sm">
                    Guardian Email
                  </th>

                  <th className="px-4 py-4 text-left text-white text-sm">
                    {t("status") ||
                      "Status"}
                  </th>

                  <th className="px-4 py-4 text-left text-white text-sm">
                    {t("actions") ||
                      "Actions"}
                  </th>

                </tr>

              </thead>

              {/* TABLE BODY */}

              <tbody className="divide-y divide-white/5">

                {filteredStudents.length ===
                0 ? (

                  <tr>
                    <td
                      colSpan={24}
                      className="text-center py-10 text-white/60"
                    >
                      {searchTerm
                        ? t(
                            "noStudentsMatch"
                          ) ||
                          "No students match your search"
                        : t(
                            "noStudentsFound"
                          ) ||
                          "No students found"}
                    </td>
                  </tr>

                ) : (

                  filteredStudents.map(
                    (
                      student,
                      index
                    ) => (

                      <tr
                        key={
                          student.id ||
                          index
                        }
                        onClick={() =>
                          setSelectedStudentForVoice(
                            student
                          )
                        }
                        className={`cursor-pointer border-t border-white/10 transition ${
                          selectedStudentForVoice?.id ===
                          student.id
                            ? "bg-purple-500/10 ring-1 ring-inset ring-purple-500/40"
                            : "hover:bg-white/5"
                        }`}
                      >

                        {/* ID */}

                        <td className="px-4 py-4 text-white/80 text-sm">
                          {student.id ||
                            "—"}
                        </td>

                        {/* ADMISSION NO */}

                        <td className="px-4 py-4 text-white/80 text-sm">
                          {student.admission_no ||
                            "—"}
                        </td>

                        {/* NAME */}

                        <td className="px-4 py-4 text-white font-medium text-sm">
                          {translations?.[
                            `studentName_${student.id}`
                          ] ||
                            student.name ||
                            "—"}
                        </td>

                        {/* STUDENT PHOTO */}

                        <PhotoCell
                          photoUrl={
                            student.photoUrl
                          }
                          alt="Student Photo"
                        />

                        {/* CLASS */}

                        <td className="px-4 py-4 text-white/80 text-sm">
                          {student.class ||
                            "—"}
                        </td>

                        {/* SECTION */}

                        <td className="px-4 py-4 text-white/80 text-sm">
                          {student.section ||
                            "—"}
                        </td>

                        {/* ROLL */}

                        <td className="px-4 py-4 text-white/80 text-sm">
                          {student.roll_no ||
                            "—"}
                        </td>

                        {/* PARENT 1 NAME */}

                        <td className="px-4 py-4 text-white/80 text-sm">
                          {translations?.[
                            `parentName_${student.id}`
                          ] ||
                            student.parent1_name ||
                            "—"}
                        </td>

                        {/* PARENT 1 PHOTO */}

                        <PhotoCell
                          photoUrl={
                            student.parent1PhotoUrl
                          }
                          alt="Parent 1 Photo"
                        />

                        {/* PARENT 1 PHONE */}

                        <td className="px-4 py-4 text-white/80 text-sm">
                          {student.parent1_phone ||
                            "—"}
                        </td>

                        {/* PARENT 1 EMAIL */}

                        <td className="px-4 py-4 text-white/80 text-sm">
                          {student.parent1_email ||
                            "—"}
                        </td>

                        {/* PARENT 2 NAME */}

                        <td className="px-4 py-4 text-white/80 text-sm">
                          {student.parent2_name ||
                            "—"}
                        </td>

                        {/* PARENT 2 PHOTO */}

                        <PhotoCell
                          photoUrl={
                            student.parent2PhotoUrl
                          }
                          alt="Parent 2 Photo"
                        />

                        {/* PARENT 2 PHONE */}

                        <td className="px-4 py-4 text-white/80 text-sm">
                          {student.parent2_phone ||
                            "—"}
                        </td>

                        {/* PARENT 2 EMAIL */}

                        <td className="px-4 py-4 text-white/80 text-sm">
                          {student.parent2_email ||
                            "—"}
                        </td>

                        {/* STUDENT CONTACT */}

                        <td className="px-4 py-4 text-white/80 text-sm">
                          {student.student_phone ||
                            student.student_contact ||
                            "—"}
                        </td>

                        {/* STUDENT EMAIL */}

                        <td className="px-4 py-4 text-white/80 text-sm">
                          {student.student_email ||
                            "—"}
                        </td>

                        {/* GUARDIAN NAME */}

                        <td className="px-4 py-4 text-white/80 text-sm">
                          {translations?.[
                            `guardianName_${student.id}`
                          ] ||
                            student.guardian_name ||
                            "—"}
                        </td>

                        {/* GUARDIAN PHOTO */}

                        <PhotoCell
                          photoUrl={
                            student.guardianPhotoUrl
                          }
                          alt="Guardian Photo"
                        />

                        {/* GUARDIAN PHONE */}

                        <td className="px-4 py-4 text-white/80 text-sm">
                          {student.guardian_phone ||
                            "—"}
                        </td>

                        {/* GUARDIAN EMAIL */}

                        <td className="px-4 py-4 text-white/80 text-sm">
                          {student.guardian_email ||
                            "—"}
                        </td>

                        {/* STATUS */}

                        <td className="px-4 py-4">

                          <button
                            onClick={(
                              event
                            ) => {
                              event.stopPropagation();

                              handleToggleStatus(
                                student
                              );
                            }}
                            className={`px-3 py-1 rounded-full text-sm font-semibold ${
                              student.status ===
                              "Active"
                                ? "bg-green-500/20 text-green-400"
                                : "bg-red-500/20 text-red-400"
                            }`}
                          >
                            {student.status ===
                            "Active"
                              ? "● Active"
                              : "○ Inactive"}
                          </button>

                        </td>

                        {/* ACTIONS */}

                        <td className="px-4 py-4">

                          <div className="flex gap-2">

                            {/* EDIT */}

                            <button
                              onClick={(
                                event
                              ) => {
                                event.stopPropagation();

                                openModal(
                                  "modify",
                                  student
                                );
                              }}
                              className="p-2 text-blue-400 hover:bg-blue-500/20 rounded-lg transition"
                              title="Modify Student"
                            >
                              <Pencil
                                size={16}
                              />
                            </button>

                            {/* DELETE */}

                            <button
                              onClick={(
                                event
                              ) => {
                                event.stopPropagation();

                                handleDelete(
                                  student
                                );
                              }}
                              className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition"
                              title="Delete Student"
                            >
                              <Trash2
                                size={16}
                              />
                            </button>

                          </div>

                        </td>

                      </tr>
                    )
                  )
                )}

              </tbody>

            </table>

          </div>
        </div>

        {/* ======================================================
            STUDENT FORM WIZARD
        ====================================================== */}

        <AnimatePresence>
          {isModalOpen && (
            <StudentFormWizard
              isOpen={isModalOpen}
              onClose={
                handleWizardClose
              }
              onSuccess={
                handleWizardSuccess
              }
              editData={
                editingStudent
              }
              theme="dark"
            />
          )}
        </AnimatePresence>

        {/* ======================================================
            PHOTO PREVIEW MODAL
        ====================================================== */}

        <AnimatePresence>
          {selectedPhoto && (
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
              className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 p-4"
              onClick={() =>
                setSelectedPhoto(
                  null
                )
              }
            >

              <motion.div
                initial={{
                  scale: 0.8,
                  opacity: 0,
                }}
                animate={{
                  scale: 1,
                  opacity: 1,
                }}
                exit={{
                  scale: 0.8,
                  opacity: 0,
                }}
                className="relative max-w-3xl max-h-[90vh] bg-white rounded-2xl p-4 shadow-2xl"
                onClick={(event) =>
                  event.stopPropagation()
                }
              >

                {/* CLOSE */}

                <button
                  type="button"
                  onClick={() =>
                    setSelectedPhoto(
                      null
                    )
                  }
                  className="absolute -top-3 -right-3 w-10 h-10 rounded-full bg-red-500 text-white flex items-center justify-center shadow-lg hover:bg-red-600 transition"
                >
                  <X size={20} />
                </button>

                {/* LARGE PHOTO */}

                <img
                  src={selectedPhoto}
                  alt="Student / Parent / Guardian"
                  className="max-w-full max-h-[80vh] object-contain rounded-xl"
                />

              </motion.div>

            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}