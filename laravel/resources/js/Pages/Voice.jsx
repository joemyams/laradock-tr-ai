import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head } from "@inertiajs/react";
import React, { useState, useRef, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useForm, Controller } from "react-hook-form";
import axios from "axios";
import {
  faCheck,
  faTimes,
  faEdit,
  faTrashCan,
  faPlus,
  faPaperPlane,
  faSpinner,
  faAngleLeft,
  faAngleRight,
} from "@fortawesome/free-solid-svg-icons";
import { sortThreadsByDateCategory } from "@/common/lib";
import InputLabel from "@/Components/InputLabel";
import Dropdown from "@/Components/Dropdown";
import TextInput from "@/Components/TextInput";
import MusicPlayer from "@/Components/MusicPlayer";
import InputError from "@/Components/InputError";
import Modal from "@/Components/Modal";
import SecondaryButton from "@/Components/SecondaryButton";
import DangerButton from "@/Components/DangerButton";

const API_URL = "https://api.openai.com/v1/chat/completions";
const API_KEY = "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";

const UserIcon = () => (
  <div className="flex items-center justify-center w-9 h-9 rounded-full bg-blue-500 text-white">
    To
  </div>
);

export default function Voice({ auth }) {
  const [onThreadSwitch, setOnThreadSwitch] = useState(false);
  const [threads, setThreads] = useState([]);
  const [currentThreadId, setCurrentThreadId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [isSidebarButtonHovered, setIsSidebarButtonHoverd] = useState(false);
  const [isTitleEditing, setIsTitleEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState("");
  const [deleteThread, setDeleteThread] = useState(false);
  const [editMessage, setEditMessage] = useState("");
  const [isEditMessage, setIsEditMessage] = useState(false);
  const [editedUserMessage, setEditedUserMessage] = useState("");
  const [editedMessageIndex, setEditedMessageIndex] = useState(null);
  const [sortedThreads, setSortedThreads] = useState([]);
  const chatMessagesRef = useRef(null);
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    reset,
    control,
  } = useForm();

  const handleSelectChange = (threadId, selectedValue) => {
    setThreads((prevThreads) =>
      prevThreads.map((thread) => {
        if (thread.id === threadId) {
          return {
            ...thread,
            selectedOption: selectedValue,
          };
        }
        return thread;
      })
    );
  };

  const options = [
    { label: "Select", value: "" },
    { label: "Man", value: "1" },
    { label: "Women", value: "2" },
  ];

  const insNotBlank = (value) => {
    return value.trim().length > 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setThreads((prevThreads) =>
      prevThreads.map((thread) =>
        thread.id === currentThreadId
          ? {
              ...thread,
              draft: {
                ...thread.draft,
                [name]: value,
              },
            }
          : thread
      )
    );
  };

  const startNewThread = () => {
    const latestThread = threads[threads.length - 1];
    if (!latestThread || latestThread.draft?.title !== "") {
      const newThread = {
        id: Date.now(),
        messages: [],
        selectedOption: "",
        draft: { title: "", chatMessage: "" },
      };
      setThreads((prevThreads) => [...prevThreads, newThread]);
      selectThread(newThread.id);
    }
  };

  const selectThread = (threadId) => {
    reset();
    setCurrentThreadId(threadId);
    setOnThreadSwitch(true);
    window.speechSynthesis.cancel();

    setEditedTitle(
      threads.find((thread) => thread.id === threadId)?.draft?.title
    );
    if (isTitleEditing && currentThreadId !== threadId) {
      setIsTitleEditing(false);
    }
  };

  const persistErrorThread = () => {
    setThreads((prevThreads) =>
      prevThreads.map((thread) =>
        thread.id === currentThreadId ? { ...thread, errors } : thread
      )
    );
  };

  const onSubmit = async () => {
    if (chatMessage === "" || isLoading) {
      return;
    }
    setIsLoading(true);
    const newThreads = threads.map((thread) => {
      if (thread.id === currentThreadId) {
        thread.messages.push({
          role: "user",
          selectedVoice: selectedOption,
          title: title.replace(/^\s+/, ""),
          content: chatMessage,
        });
        thread.draft.chatMessage = "";
        thread.draft.title = title.replace(/^\s+/, "");
      }
      return thread;
    });
    setThreads(newThreads);
    await sendToOpenAI(
      newThreads.find((thread) => thread.id === currentThreadId).messages
    );
    setIsLoading(false);
  };

  const sendToOpenAI = async (threadMessages) => {
    const userMessage = threadMessages.map((msg) => {
      return {
        role: msg.role,
        content: msg.content + "",
      };
    });
    try {
      const response = await axios.post(
        API_URL,
        {
          model: "gpt-3.5-turbo",
          messages: userMessage,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${API_KEY}`,
          },
        }
      );

      const botMessage = response.data.choices[0].message.content;

      setThreads((threads) =>
        threads.map((thread) => {
          if (thread.id === currentThreadId) {
            thread.messages.push({
              role: "assistant",
              content: JSON.stringify(botMessage),
            });
          }
          return thread;
        })
      );
    } catch (error) {
      console.error(error);
    }
  };

  const currentThread = threads.find((thread) => thread.id === currentThreadId);
  const selectedOption =
    threads.find((thread) => thread.id === currentThreadId)?.selectedOption ||
    "";
  const title =
    threads.find((thread) => thread.id === currentThreadId)?.draft?.title || "";
  const chatMessage =
    threads.find((thread) => thread.id === currentThreadId)?.draft
      ?.chatMessage || "";
  const latestMessage = currentThread?.messages
    ? currentThread?.messages[currentThread.messages.length - 1]
    : null;

  const handleDeleteThread = (threadId) => {
    const threadIndex = threads.findIndex((thread) => thread.id === threadId);
    if (threadIndex !== -1) {
      setThreads((prevThreads) =>
        prevThreads.filter((thread) => thread.id !== threadId)
      );
      if (currentThreadId === threadId) {
        const nextThreadIndex = threadIndex === 0 ? 1 : threadIndex - 1;
        setCurrentThreadId(threads[nextThreadIndex]?.id || null);
      }
      setDeleteThread(false);
    }
  };

  const toggleTitleEdit = () => {
    setEditedTitle(title);
    setIsTitleEditing(!isTitleEditing);
  };

  const handleTitleChange = (event) => {
    setEditedTitle(event.target.value);
  };

  const handleSaveEditedTitle = () => {
    const trimmedEditedTitle = editedTitle.replace(/^\s+/, "");
    if (editedTitle.trim() !== "") {
      setThreads((prevThreads) =>
        prevThreads.map((thread) =>
          thread.id === currentThreadId
            ? {
                ...thread,
                draft: {
                  ...thread.draft,
                  title: trimmedEditedTitle,
                },
                messages: [
                  {
                    ...thread.messages[0],
                    title: (trimmedEditedTitle || "").slice(0, 30),
                  },
                  ...thread.messages.slice(1),
                ],
              }
            : thread
        )
      );
    }
    setIsTitleEditing(false);
  };
  const handleKeyDown = (e) => {
    persistErrorThread();
    if (e.key === "Enter") {
      e.preventDefault();
      handleSubmit(onSubmit)();
    }
  };

  const showEditMessage = (indexId, value) => {
    !isEditMessage
      ? (setEditMessage(
          <button
            type="button"
            className="mr-8 items-end text-gray-500 hover:text-gray-700 cursor-pointer"
            onClick={() => {
              setIsEditMessage(true);
              setEditedMessageIndex(indexId);
              setEditedUserMessage(value);
            }}
          >
            <FontAwesomeIcon size="sm" icon={faEdit} />
          </button>
        ),
        setEditedMessageIndex(indexId))
      : null;
  };

  const hideEditMessage = () => {
    setEditMessage("");
  };

  const handleSaveEditedMessage = async () => {
    setIsLoading(true);
    const updatedThreads = [...threads];
    const currentThread = updatedThreads.find(
      (thread) => thread.id === currentThreadId
    );

    if (currentThread) {
      currentThread.messages = currentThread.messages
        .map((message, index) => {
          if (editedMessageIndex === index) {
            return {
              role: "user",
              title: title.replace(/^\s+/, ""),
              content: editedUserMessage,
            };
          } else if (index < editedMessageIndex) {
            return message;
          }
          return null;
        })
        .filter((content) => content !== null);
    }

    setThreads(updatedThreads);
    setEditedUserMessage("");
    setIsEditMessage(false);
    setEditedMessageIndex(null);
    await sendToOpenAI(currentThread.messages);
    setIsLoading(false);
  };

  useEffect(() => {
    const getSortedThreads = sortThreadsByDateCategory(threads);
    setSortedThreads(getSortedThreads);
    chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
    setValue("selectedValue", selectedOption);
    setValue("title", title);
    setValue("chatMessage", chatMessage);
  }, [threads]);

  return (
    <AuthenticatedLayout
      user={auth.user}
      header={
        <h2 className="font-semibold text-xl text-gray-800 leading-tight">
          Voice
        </h2>
      }
    >
      <Head title="Voice" />

      <div className="flex h-full">
        {showSidebar && (
          <div className="w-80 min-h-screen pl-4 py-4 border-r">
            <button
              onClick={startNewThread}
              className="mb-4 py-2 px-4 bg-gray-500 text-white rounded hover:bg-gray-700"
            >
              <FontAwesomeIcon icon={faPlus} />
            </button>
            <div className="threadlist-container overflow-y-hidden hover:overflow-y-auto max-h-[calc(100vh-6rem)]">
              {sortedThreads.map((dateCategory) => (
                <div className="mb-2" key={dateCategory.label}>
                  <h1 className="px-2 text-gray-500 text-sm font-semibold">
                    {dateCategory.label}
                  </h1>
                  {dateCategory.threads
                    .sort((a, b) => b.id - a.id)
                    .map((thread) => {
                      const titleContent = (
                        thread.messages[0]?.title || ""
                      ).slice(0, 30);
                      return (
                        <div
                          key={thread.id}
                          onClick={() => selectThread(thread.id)}
                          className={`p-2 cursor-pointer border-b border-gray-200 relative ${
                            currentThreadId === thread.id
                              ? "bg-gray-200 rounded-l-sm"
                              : "hover:bg-[#edeff4]"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <p
                              onClick={() => selectThread(thread.id)}
                              className={`font-bold cursor-pointer ${
                                currentThreadId === thread.id && thread
                                  ? "whitespace-nowrap"
                                  : "turncate"
                              }`}
                            >
                              Thread {thread.id}
                            </p>
                            {currentThreadId === thread.id &&
                              thread.messages.length > 0 && (
                                <>
                                  <div className="absolute right-[40px] w-12 h-4 bg-gradient-to-r from-transparent to-gray-200" />
                                  <div className="absolute right-0 flex items-center gap-2 px-2 bg-gray-200">
                                    {isTitleEditing ? (
                                      <>
                                        <button
                                          className="text-gray-500 hover:text-green-700"
                                          onClick={handleSaveEditedTitle}
                                        >
                                          <FontAwesomeIcon
                                            className="md"
                                            icon={faCheck}
                                          />
                                        </button>
                                        <button
                                          className="text-gray-500 hover:text-red-700"
                                          onClick={() => {
                                            setIsTitleEditing(false);
                                            setEditedTitle(title);
                                          }}
                                        >
                                          <FontAwesomeIcon
                                            className="md"
                                            icon={faTimes}
                                          />
                                        </button>
                                      </>
                                    ) : (
                                      <>
                                        <button
                                          className="ml-5 hover:text-blue-700 transition-colors duration-200"
                                          onClick={toggleTitleEdit}
                                        >
                                          <FontAwesomeIcon
                                            size="sm"
                                            icon={faEdit}
                                          />
                                        </button>
                                        <button
                                          onClick={() => setDeleteThread(true)}
                                          className="hover:text-red-700 transition-colors duration-200"
                                        >
                                          <FontAwesomeIcon
                                            size="sm"
                                            icon={faTrashCan}
                                          />
                                        </button>
                                      </>
                                    )}
                                  </div>
                                </>
                              )}
                          </div>
                          {isTitleEditing && currentThreadId === thread.id ? (
                            <input
                              type="text"
                              value={editedTitle}
                              onChange={handleTitleChange}
                              className="w-full h-6 p-1 mt-1 rounded-sm text-gray-500 border border-gray-300 focus:outline-none focus:ring-blue-300"
                            />
                          ) : (
                            <p className="text-gray-500 truncate">
                              {titleContent}
                            </p>
                          )}
                        </div>
                      );
                    })}
                </div>
              ))}
            </div>
          </div>
        )}
        <Modal show={deleteThread} maxWidth="sm">
          <div className="text-gray-700 p-4 space-y-4">
            <h1 className="font-bold">Delete thread ?</h1>
            <hr />
            <p>
              This will delete{" "}
              <strong>
                {threads.find((thread) => thread.id === currentThreadId)?.title}
              </strong>
              .
            </p>
            <div className="flex justify-end gap-2">
              <SecondaryButton onClick={() => setDeleteThread(false)}>
                Cancel
              </SecondaryButton>
              <DangerButton onClick={() => handleDeleteThread(currentThreadId)}>
                Delete
              </DangerButton>
            </div>
          </div>
        </Modal>

        <div className="flex flex-col w-full">
          <div className="overflow-auto p-4" ref={chatMessagesRef}>
            <div className="relative group w-fit mb-4">
              <button
                onClick={() => {
                  setShowSidebar(!showSidebar),
                    setIsSidebarButtonHoverd(false),
                    setIsTitleEditing(false);
                }}
                onMouseEnter={() => setIsSidebarButtonHoverd(true)}
                onMouseLeave={() => setIsSidebarButtonHoverd(false)}
                className="y-2 px-4 bg-gray-500 text-white rounded hover:bg-gray-700"
              >
                <FontAwesomeIcon
                  icon={showSidebar ? faAngleLeft : faAngleRight}
                />
              </button>
              <div className="transition-opacity duration-500 ease-in-out opacity-0 group-hover:opacity-100">
                {isSidebarButtonHovered && (
                  <>
                    <div className="absolute -right-4 top-4 h-2 w-2 bg-white shadow-md origin-center rotate-45" />
                    <div className="absolute -right-28 top-[6px] py-1 px-2 rounded-md bg-white shadow-md text-gray-500 text-sm font-medium">
                      {showSidebar ? "Close sidebar" : "Show sidebar"}
                    </div>
                  </>
                )}
              </div>
            </div>

            {currentThreadId !== null && (
              <>
                <h2 className="mb-4 font-bold text-lg">
                  Thread {currentThreadId}
                </h2>
                <form
                  onKeyDown={handleKeyDown}
                  onSubmit={handleSubmit(onSubmit)}
                >
                  <div className="relative mt-2 flex">
                    <div className="flex flex-col">
                      <div className="flex">
                        <InputLabel
                          className="text-gray-600 pt-2 pr-2"
                          value="Voice Type: "
                        />
                        <div>
                          <Controller
                            name="selectedValue"
                            control={control}
                            rules={{ required: "*Please select voice type." }}
                            render={({ field }) => (
                              <Dropdown
                                threadId={currentThreadId}
                                selectedOption={selectedOption}
                                handleSelectChange={(selectedValue) => {
                                  handleSelectChange(
                                    currentThreadId,
                                    selectedValue
                                  );
                                  field.onChange(selectedValue);
                                }}
                              >
                                <Dropdown.Select
                                  id="selectedValue"
                                  options={options}
                                  value={selectedOption}
                                  onChange={(selectedValue) => {
                                    handleSelectChange(
                                      currentThreadId,
                                      selectedValue
                                    );
                                    field.onChange(selectedValue);
                                  }}
                                />
                              </Dropdown>
                            )}
                          />
                          {currentThread?.errors?.selectedValue && (
                            <InputError
                              className="text-red-500 text-sm mt-1"
                              message={
                                currentThread.errors.selectedValue.message
                              }
                            />
                          )}
                        </div>
                      </div>
                      <div className="flex mt-4">
                        <InputLabel
                          htmlFor="title"
                          className="text-gray-600 pt-2 pr-2"
                          value="Title"
                        />
                        <div>
                          <TextInput
                            id="title"
                            type="text"
                            className="ml-11 w-96"
                            {...register("title", {
                              required: "*Please enter title",
                              validate: {
                                insNotBlank: (value) =>
                                  insNotBlank(value) || "*Please enter title",
                              },
                            })}
                            name="title"
                            value={title}
                            onChange={handleChange}
                          />
                          {currentThread?.errors?.title && (
                            <InputError
                              className="text-red-500 text-sm mt-1 ml-8"
                              message={currentThread.errors.title.message}
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="border-t p-4 mt-4">
                    {currentThread.messages.map((message, index) => (
                      <div key={index}>
                        {message.role === "user" && (
                          <div
                            onMouseMoveCapture={() =>
                              showEditMessage(index, message.content)
                            }
                            onMouseLeave={hideEditMessage}
                            className="flex items-top"
                          >
                            <UserIcon className="block h-9 w-auto fill-current text-gray-800" />
                            <div className="p-4 flex-grow">
                              <div>
                                {isEditMessage &&
                                editedMessageIndex === index ? (
                                  <input
                                    text="text"
                                    defaultValue={editedUserMessage}
                                    onChange={(e) =>
                                      setEditedUserMessage(e.target.value)
                                    }
                                    className="border-none w-full focus:outline-none focus:ring-0 bg-gray-100"
                                  />
                                ) : (
                                  <p>{message.content}</p>
                                )}
                              </div>
                              {isEditMessage && editedMessageIndex === index ? (
                                <div className="flex items-center justify-center gap-2">
                                  <button
                                    type="button"
                                    onClick={handleSaveEditedMessage}
                                    className="text-sm p-1 text-white rounded bg-green-500 hover:bg-green-700"
                                  >
                                    Save & Submit
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setIsEditMessage(false)}
                                    className="text-sm p-1 text-white rounded bg-gray-500 hover:bg-gray-700"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              ) : null}
                            </div>
                            {!isEditMessage && editedMessageIndex === index
                              ? editMessage
                              : null}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {currentThreadId && (
                    <div className="border-t p-4 mt-4">
                      <div className="flex items-center">
                        <div className="flex flex-col flex-grow">
                          <textarea
                            className="flex-grow mr-2 p-2 rounded border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            {...register("chatMessage", {
                              required: "*Please enter message",
                              validate: {
                                insNotBlank: (value) =>
                                  insNotBlank(value) || "*Please enter message",
                              },
                            })}
                            name="chatMessage"
                            value={chatMessage}
                            onChange={handleChange}
                          />
                          {currentThread?.errors?.chatMessage && (
                            <InputError
                              className="text-red-500 text-sm mt-1"
                              message={currentThread.errors.chatMessage.message}
                            />
                          )}
                        </div>
                        <button
                          onClick={persistErrorThread}
                          type="submit"
                          className="py-2 px-4 bg-gray-500 text-white rounded hover:bg-gray-700"
                        >
                          {isLoading ? (
                            <FontAwesomeIcon
                              icon={faSpinner}
                              className="animate-spin"
                            />
                          ) : (
                            <FontAwesomeIcon icon={faPaperPlane} />
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </form>
                {latestMessage && (
                  <MusicPlayer
                    latestMessage={latestMessage?.content}
                    selectedVoice={selectedOption}
                    onThreadSwitch={onThreadSwitch}
                    doneThreadSwitch={() => setOnThreadSwitch(false)}
                  />
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
