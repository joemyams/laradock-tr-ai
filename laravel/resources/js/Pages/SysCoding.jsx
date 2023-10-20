import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head } from "@inertiajs/react";
import React, { useState, useEffect } from "react";
import ApplicationLogo from "@/Components/ApplicationLogo";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useForm, Controller } from "react-hook-form";
import {
  faPlus,
  faMessage,
  faCheck,
  faTimes,
  faPaperPlane,
  faSpinner,
  faAngleLeft,
  faAngleRight,
  faTrashCan,
  faEdit,
  faCopy,
} from "@fortawesome/free-solid-svg-icons";
import InputLabel from "@/Components/InputLabel";
import TextInput from "@/Components/TextInput";
import Dropdown from "@/Components/Dropdown";
import InputError from "@/Components/InputError";
import CodeResponseMessage from "@/Components/CodedResponseMessage";
import { sortThreadsByDateCategory } from "@/common/lib";
import Modal from "@/Components/Modal";
import DangerButton from "@/Components/DangerButton";
import SecondaryButton from "@/Components/SecondaryButton";
import axios from "axios";

const CURL = "https://api.openai.com/v1/completions";
const API_URL = "https://api.openai.com/v1/chat/completions";
const API_KEY = "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";

const UserIcon = () => (
  <div className="flex items-center justify-center w-9 h-9 rounded-full bg-blue-500 text-white">
    To
  </div>
);

export default function SysCoding({ auth }) {
  const [threads, setThreads] = useState([]);
  const [currentThreadId, setCurrentThreadId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarButtonHovered, setIsSidebarButtonHovered] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [editInput, setEditInput] = useState(false);
  const [updateTitles, setUpdateTitles] = useState("");
  const [sortedThreads, setSortedThreads] = useState([]);
  const [deleteThread, setDeleteThread] = useState(false);
  const [editMessage, setEditMessage] = useState("");
  const [isEditMessage, setIsEditMessage] = useState(false);
  const [editedUserMessage, setEditedUserMessage] = useState("");
  const [editedMessageIndex, setEditedMessageIndex] = useState(null);
  const [addThreads, setAddThreads] = useState(false);
  const [showCopiedMessage, setShowCopiedMessage] = useState(false);
  const [selectedResponseIndex, setSelectedResponseIndex] = useState(null);
  const [count, setCount] = useState(0);
  const message =
    threads.find((thread) => thread.id === currentThreadId)?.message || "";
  const title =
    threads.find((thread) => thread.id === currentThreadId)?.title || "";
  const selectedOption =
    threads.find((thread) => thread.id === currentThreadId)?.selectedOption ||
    "";
  const scrollContainer = {
    maxHeight: "calc(100vh - 8rem)",
    overflowY: "auto",
  };

  const toggleSidebar = () => {
    setShowSidebar(!showSidebar);
  };

  const {
    register,
    handleSubmit,
    setValue,
    control,
    reset,
    formState: { errors },
  } = useForm();

  const options = [
    { label: "select", value: "select" },
    { label: "laravel", value: "Laravel" },
    { label: "react", value: "React.js" },
    { label: "vue", value: "Vue.js" },
  ];

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

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setThreads((prevThreads) =>
      prevThreads.map((thread) =>
        thread.id === currentThreadId ? { ...thread, [name]: value } : thread
      )
    );
  };

  const handleMessageChange = (e) => {
    const { name, value } = e.target;
    setThreads((prevThreads) =>
      prevThreads.map((thread) =>
        thread.id === currentThreadId ? { ...thread, [name]: value } : thread
      )
    );
  };

  const startNewThread = () => {
    if (!addThreads) {
      const newThread = {
        id: Date.now(),
        messages: [],
        errors: [],
        message: "",
        title: "",
        threadTitle: "",
      };
      setThreads((prevThreads) => [...prevThreads, newThread]);
      setCurrentThreadId(newThread.id);
      setAddThreads(true);
      setCount(0);
      reset();
    }
    return;
  };

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

  const handleSaveTitleUpdate = (threadId) => {
    setThreads((prevThreads) =>
      prevThreads.map((thread) =>
        thread.id === threadId
          ? { ...thread, threadTitle: updateTitles }
          : thread
      )
    );
    setEditInput(false);
  };

  const selectThread = (threadId) => {
    reset();
    setCurrentThreadId(threadId);
  };

  const persistErrrorThread = () => {
    setThreads((prevThreads) =>
      prevThreads.map((thread) =>
        thread.id === currentThreadId ? { ...thread, errors } : thread
      )
    );
  };

  const isNotBlank = (message) => (value) => {
    if (!value.trim()) {
      return message;
    }
    return undefined;
  };

  const showEditMessage = (indexId, value) => {
    !isEditMessage
      ? (setEditMessage(
          <button
            type="button"
            className="text-gray-500 hover:text-gray-700 cursor-pointer"
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
      const updatedMessages = [];
      let deletedSubsequentMessages = false;

      for (let index = 0; index < currentThread.messages.length; index++) {
        if (editedMessageIndex === index) {
          updatedMessages.push({
            role: "user",
            selectedOption: selectedOption,
            message: editedUserMessage,
          });
          deletedSubsequentMessages = true;
        } else if (!deletedSubsequentMessages) {
          updatedMessages.push(currentThread.messages[index]);
        }
      }
      currentThread.messages = updatedMessages.filter(
        (message) => message !== null
      );
    }
    setThreads(updatedThreads);
    setEditedUserMessage("");
    setIsEditMessage(false);
    setEditedMessageIndex(null);
    await sendToOpenAI(currentThread.messages);
    setIsLoading(false);
  };

  const onSubmit = async () => {
    if (message === "" || isLoading) return;
    setIsLoading(true);
    const newThreads = threads.map((thread) => {
      thread.id === currentThreadId
        ? setAddThreads(false)
        : setAddThreads(true);
      if (thread.id === currentThreadId) {
        thread.messages.push({
          role: "user",
          selectedOption: selectedOption,
          title: title,
          message: message,
        });
        thread.message = "";
      }
      return thread;
    });
    setThreads(newThreads);
    await sendToOpenAI(
      newThreads.find((thread) => thread.id === currentThreadId).messages
    );
    setIsLoading(false);
  };

  function detectCode(message) {
    const codeSnippetRegex = /```[\s\S]*?```/g;
    return codeSnippetRegex.test(message);
  }

  const codeResponse = (message) => {
    const botMessage = message
      .split(/(```[\s\S]*?```)/g)
      .map((content) =>
        detectCode(content) ? handleGenerateSnip(content) : content
      );
    return botMessage;
  };

  const handleGenerateSnip = (message) => {
    const codeSnippetRegex = /```([^\s]+)\s*([\s\S]*?)```/g;
    let match;
    let newSnippet = {};
    while ((match = codeSnippetRegex.exec(message)) !== null) {
      const language = match[1];
      const code = match[2];
      newSnippet = { language, code };
    }
    return newSnippet;
  };

  const sendToOpenAI = async (threadMessages) => {
    const userMessage = threadMessages.map((msg) => {
      return {
        role: msg.role,
        content: msg.selectedOption + " " + msg.title + " " + msg.message,
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
            Authorization: `Bearer ${API_KEY}`,
            "Content-Type": "application/json",
          },
        }
      );
      const assistant = response.data.choices[0].message.content;
      const assistantReply = detectCode(assistant)
        ? codeResponse(assistant)
        : assistant;
      assistantResponse(assistantReply);
      await generateTitle(assistantReply, currentThreadId);
    } catch (error) {
      console.error(error);
    }
  };

  const assistantResponse = (assistantReply) => {
    setThreads((threads) =>
      threads.map((thread) => {
        if (thread.id === currentThreadId) {
          thread.messages.push({
            role: "assistant",
            content: JSON.stringify(assistantReply),
          });
        }
        return thread;
      })
    );
  };

  const generateTitle = async (threadContent, threadId) => {
    if (threadId) {
      setCount(count + 1);
    }
    if (count <= 0) {
      try {
        const response = await axios.post(
          CURL,
          {
            model: "gpt-3.5-turbo-instruct",
            prompt: `Sumarize and Generate a label of this content: "${threadContent}"`,
            max_tokens: 5,
            temperature: 0,
          },
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${API_KEY}`,
            },
          }
        );
        const title = response.data.choices[0].text;
        setThreads((prevThreads) =>
          prevThreads.map((thread) => {
            if (thread.id === currentThreadId) {
              return {
                ...thread,
                threadTitle: title,
              };
            }
            return thread;
          })
        );
      } catch (error) {
        console.log(error);
      }
    }
    return;
  };

  const handleKeyDown = (e) => {
    persistErrrorThread();
    if (e.key === "Enter") {
      e.preventDefault();
      handleSubmit(onSubmit)();
    }
  };

  const handleCopyMessage = (index, e) => {
    e.preventDefault();
    const textToCopy = document.getElementById(`textToCopy_${index}`);

    if (textToCopy) {
      const range = document.createRange();
      range.selectNode(textToCopy);
      window.getSelection().removeAllRanges();
      window.getSelection().addRange(range);
      document.execCommand("copy");
      window.getSelection().removeAllRanges();
      setSelectedResponseIndex(index);
      setShowCopiedMessage(true);
    }
  };

  useEffect(() => {
    setShowCopiedMessage(false);
    setSelectedResponseIndex(null);
    const getSortedThreads = sortThreadsByDateCategory(threads);
    setSortedThreads(getSortedThreads);
    setUpdateTitles(
      threads.find((thread) => thread.id === currentThreadId)?.threadTitle || ""
    );
    setEditInput(false);
    setValue("selectedOption", selectedOption);
    setValue("title", title.replace(/^\s+/, ""));
    setValue("message", message);
  }, [threads, selectedOption, title, message, currentThreadId]);

  return (
    <AuthenticatedLayout
      user={auth.user}
      header={
        <h2 className="font-semibold text-xl text-gray-800 leading-tight">
          SysCoding
        </h2>
      }
    >
      <Head title="SysCoding" />
      <div className="flex ...">
        {showSidebar && (
          <div className="shrink-0 w-full lg:w-72 md:w-60 min-h-screen pl-4 py-4 border-r">
            <div className="flex items-start">
              <button
                onClick={startNewThread}
                className="mb-4 py-2 px-4 bg-gray-500 text-white rounded hover:bg-gray-700"
              >
                <FontAwesomeIcon icon={faPlus} />
              </button>
              <button
                className="lg:hidden md:hidden ml-60 px-4 rounded bg-gray-500 hover:bg-gray-700 text-white"
                onClick={() => setShowSidebar(!showSidebar)}
              >
                <FontAwesomeIcon icon={faAngleLeft} />
              </button>
            </div>
            <div className="mt-4 threadlist-container overflow-y-hidden hover:overflow-y-auto max-h-[calc(100vh-6rem)]">
              {sortedThreads.map((dateCategory) => (
                <div className="mb-2" key={dateCategory.label}>
                  <h1 className="px-2 text-gray-500 text-sm font-semibold">
                    {dateCategory.label}
                  </h1>
                  {dateCategory.threads
                    .sort((a, b) => b.id - a.id)
                    .map((thread) => {
                      return (
                        <div
                          key={thread.id}
                          onClick={() => selectThread(thread.id)}
                          className={`p-2 cursor-pointer border-b border-gray-200 relative ${
                            currentThreadId === thread.id
                              ? "bg-gray-300 rounded-l-sm"
                              : "hover:bg-[#edeff4]"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <p
                              onClick={() => selectThread(thread.id)}
                              className={`font-bold cursor-pointer ${
                                currentThreadId === thread.id &&
                                thread.threadTitle
                                  ? "whitespace-nowrap"
                                  : "turncate"
                              }`}
                            >
                              Thread {thread.id}
                            </p>
                            {thread.threadTitle &&
                              currentThreadId === thread.id && (
                                <>
                                  <div className="absolute right-[40px] w-12 h-4 bg-gradient-to-r from-transparent to-gray-300" />
                                  <div className="absolute right-0 flex items-center gap-2 px-2 bg-gray-300">
                                    {editInput ? (
                                      <>
                                        <button
                                          className="text-gray-500 hover:text-gray-700"
                                          onClick={() =>
                                            handleSaveTitleUpdate(
                                              thread.id,
                                              updateTitles
                                            )
                                          }
                                        >
                                          <FontAwesomeIcon
                                            className="md"
                                            icon={faCheck}
                                          />
                                        </button>
                                        <button
                                          className="text-gray-500 hover:text-gray-700"
                                          onClick={() => {
                                            setEditInput(false);
                                            setUpdateTitles(thread.threadTitle);
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
                                          className="text-gray-500 hover:text-gray-700"
                                          onClick={() => {
                                            setEditInput(true);
                                            setUpdateTitles(thread.threadTitle);
                                          }}
                                        >
                                          <FontAwesomeIcon
                                            size="sm"
                                            icon={faEdit}
                                          />
                                        </button>
                                        <button
                                          className="text-gray-500 hover:text-gray-700"
                                          onClick={() => setDeleteThread(true)}
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
                          {editInput && currentThreadId === thread.id ? (
                            <input
                              type="text"
                              value={updateTitles}
                              onChange={(e) => setUpdateTitles(e.target.value)}
                              className="w-full h-6 p-1 mt-1 rounded-sm text-gray-500 border border-gray-300 focus:outline-none focus:ring-blue-300"
                            />
                          ) : (
                            <div className="text-gray-500 truncate">
                              <FontAwesomeIcon icon={faMessage} />
                              {thread.threadTitle}
                            </div>
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
            <h1 className="mt-2 text-lg font-bold">Delete thread?</h1>
            <hr />
            <p>
              This will delete{" "}
              <strong className="text-xl">
                {threads.find((thread) => thread.id === currentThreadId)?.title}
                .
              </strong>
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

        <div className="flex-1 min-h-screen">
          <div style={scrollContainer} className="p-4">
            <div className="relative group w-fit mb-4">
              <button
                onClick={() => {
                  setShowSidebar(!showSidebar),
                    setIsSidebarButtonHovered(false);
                }}
                onMouseEnter={() => setIsSidebarButtonHovered(true)}
                onMouseLeave={() => setIsSidebarButtonHovered(false)}
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
                    <div className="flex flex-col flex-grow">
                      <div className="flex items-center">
                        <InputLabel
                          className="text-gray-600 p-4"
                          value="Language: "
                        />
                        <div className="container">
                          <Controller
                            name="selectedOption"
                            control={control}
                            rules={{ required: "*Language is required." }}
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
                                  disabled={
                                    threads.find(
                                      (thread) => thread.id === currentThreadId
                                    ).messages[0]?.selectedOption
                                      ? true
                                      : false
                                  }
                                  id="selectedOption"
                                  name="selectedOption"
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
                          {threads.find(
                            (thread) => thread.id === currentThreadId
                          )?.errors?.selectedOption && (
                            <InputError
                              className="text-red-500 text-sm mt-1 ml-1"
                              message={
                                threads.find(
                                  (thread) => thread.id === currentThreadId
                                ).errors.selectedOption.message
                              }
                            />
                          )}
                        </div>
                      </div>
                      <div className="flex items-center">
                        <InputLabel
                          htmlFor="title"
                          className="text-gray-600 p-4"
                          value="Title: "
                        />
                        <div className="w-full mb-2">
                          <TextInput
                            disabled={
                              threads.find(
                                (thread) => thread.id === currentThreadId
                              ).messages[0]?.title
                                ? true
                                : false
                            }
                            id="title"
                            type="text"
                            name="title"
                            {...register("title", {
                              required: "*Title is required.",
                              validate: isNotBlank(
                                "*Blank space are not allowed."
                              ),
                            })}
                            value={title}
                            className="block w-9/12 rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            onChange={handleInputChange}
                          />
                          {threads.find(
                            (thread) => thread.id === currentThreadId
                          )?.errors?.title && (
                            <InputError
                              className="text-red-500 text-sm mt-1 ml-2"
                              message={
                                threads.find(
                                  (thread) => thread.id === currentThreadId
                                ).errors.title.message
                              }
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  <>
                    {threads
                      .find((thread) => thread.id === currentThreadId)
                      .messages.map((message, index) => (
                        <div
                          key={index}
                          className={`my-2 ${
                            message.role === "user"
                              ? "self-end"
                              : "flex self-start"
                          }`}
                        >
                          {message.role === "assistant" && (
                            <div className="flex items-center space-y-2">
                              <ApplicationLogo className="block h-9 w-auto fill-current text-gray-800" />
                              <div className="p-2 ml-2 rounded-md bg-gray-200">
                                {Array.isArray(JSON.parse(message.content)) ? (
                                  <CodeResponseMessage
                                    content={message.content}
                                  />
                                ) : (
                                  <div
                                    id={`textToCopy_${index}`}
                                    className="p-2 rounded-md bg-gray-200 relative"
                                  >
                                    <button
                                      className="absolute top-[-14px] right-[-4px] p-2"
                                      onClick={(e) =>
                                        handleCopyMessage(index, e)
                                      }
                                    >
                                      {selectedResponseIndex === index &&
                                      showCopiedMessage ? (
                                        <FontAwesomeIcon icon={faCheck} />
                                      ) : (
                                        <FontAwesomeIcon icon={faCopy} />
                                      )}
                                    </button>
                                    <pre className="whitespace-pre-wrap pe-9">
                                      {JSON.parse(message.content)}
                                    </pre>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                          {message.role === "user" && (
                            <div className="flex items-center space-y-2">
                              <UserIcon className="block h-9 w-auto fill-current text-gray-800" />
                              <div className="p-4 ml-2 flex-grow rounded-md border border-gray-300">
                                <div
                                  onMouseMoveCapture={() =>
                                    showEditMessage(index, message.message)
                                  }
                                  onMouseLeave={hideEditMessage}
                                  className="flex items-center"
                                >
                                  <div className="flex-grow">
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
                                        <p>{message.message}</p>
                                      )}
                                    </div>
                                    {isEditMessage &&
                                    editedMessageIndex === index ? (
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
                                          onClick={() =>
                                            setIsEditMessage(false)
                                          }
                                          className="text-sm p-1 text-white rounded bg-gray-500 hover:bg-gray-700"
                                        >
                                          Cancel
                                        </button>
                                      </div>
                                    ) : null}
                                  </div>
                                  {!isEditMessage &&
                                  editedMessageIndex === index
                                    ? editMessage
                                    : null}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                  </>
                  {currentThreadId && (
                    <div className="border-t p-4">
                      <div className="flex items-center">
                        <div className="w-full">
                          <InputLabel
                            htmlFor="message"
                            className="text-gray-600"
                          />
                          <textarea
                            id="message"
                            name="message"
                            {...register("message", {
                              required: "*Message is required.",
                              validate: isNotBlank(
                                "*Blank space are not allowed."
                              ),
                            })}
                            value={message}
                            className="w-full flex-grow mr-2 p-5 rounded border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            onChange={handleMessageChange}
                          />
                          {threads.find(
                            (thread) => thread.id === currentThreadId
                          )?.errors?.message && (
                            <InputError
                              className="text-red-500 text-sm mt-1 ml-2"
                              message={
                                threads.find(
                                  (thread) => thread.id === currentThreadId
                                ).errors.message.message
                              }
                            />
                          )}
                        </div>
                        <button
                          onClick={persistErrrorThread}
                          type="submit"
                          className="ml-2 py-2 px-4 bg-gray-500 text-white rounded hover:bg-gray-700"
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
              </>
            )}
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
