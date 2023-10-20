import React, { useCallback, useEffect, useState } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head } from "@inertiajs/react";
import ButtonCopyToClipboard from "@/Components/ButtonCopyToClipboard";

import axios from "axios";
import TextWithEdits from "../Components/TextWithEdits";

const API_URL = "https://api.openai.com/v1/";
const MODEL = "text-davinci-edit-001";
const API_KEY = "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";

export default function Proofread({ auth }) {
  const [message, setMessage] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [resultMode, seResultMode] = useState(false);

  useEffect(() => {}, [answer]);

  const handleSubmit = useCallback(
    async (event) => {
      event.preventDefault();

      if (!message) {
        alert("メッセージがありません。");
        return;
      }

      if (!message.trim()) {
        alert("Blank space are not allowed。");
        return;
      }

      setAnswer("");
      seResultMode(false);

      if (loading) return;
      setLoading(true);

      try {
        const response = await axios.post(
          `${API_URL}edits`,
          {
            model: MODEL,
            input: message,
            instruction: "文章の誤字、脱字、スペルミスを修正してください。",
            temperature: 0.2,
          },
          {
            // HTTPヘッダー(認証)
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${API_KEY}`,
            },
          }
        );
        setAnswer(response.data.choices[0].text.trim());
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
        seResultMode(true);
      }
    },
    [loading, message]
  );

  return (
    <AuthenticatedLayout
      user={auth.user}
      header={
        <h2 className="font-semibold text-xl text-gray-800 leading-tight">
          Proofread
        </h2>
      }
    >
      <Head title="Proofread" />

      <div className="flex flex-wrap">
        <div className="w-full sm:w-[620px]">
          {resultMode ? (
            <button
              type="button"
              className="sm:ml-8 h-6 sm:h-8 w-12 mx-2 my-2 items-center gap-2 rounded-md border border-transparent font-semibold bg-blue-500 text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all text-sm dark:focus:ring-offset-gray-800"
              onClick={() => seResultMode(false)}
            >
              Edit
            </button>
          ) : (
            <div name="spacer" className="mt-6 sm:mt-14" />
          )}

          <div className="h-32 sm:h-full sm:ml-8 mx-2 bg-white overflow-hidden shadow-sm sm:rounded-lg">
            <div className="text-gray-900">
              {resultMode ? (
                <div className=" h-screen p-2 mx-2 bg-white overflow-hidden shadow-sm sm:rounded-lg">
                  <div className="text-gray-900">
                    {message && answer && TextWithEdits(answer, message)}
                  </div>
                </div>
              ) : (
                <textarea
                  rows="100"
                  className="py-2 px-4 block w-full border-gray-200 rounded-md text-sm focus:border-blue-500 focus:ring-blue-500 sm:p-4 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400"
                  placeholder="Input here..."
                  value={message}
                  onChange={(e) => {
                    setMessage(e.target.value);
                  }}
                />
              )}
            </div>
          </div>
        </div>

        <div className="px-2 p-2 ml-64 sm:ml-0 ">
          <div name="spacer" className="w-0 sm:mt-10" />
          {loading ? (
            <div className="text-center">
              <div role="status">
                <svg
                  aria-hidden="true"
                  className="inline w-5 h-5 text-gray-200 animate-spin dark:text-gray-600 fill-blue-600"
                  viewBox="0 0 100 101"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
                    fill="currentColor"
                  />
                  <path
                    d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                    fill="currentFill"
                  />
                </svg>
              </div>
            </div>
          ) : (
            <button
              type="button"
              className="h-6 w-12 sm:w-10 sm:h-6 sm:h-10 px-1 items-center gap-2 rounded-md border border-transparent font-semibold bg-blue-500 text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all text-sm dark:focus:ring-offset-gray-800"
              onClick={handleSubmit}
            >
              →
            </button>
          )}
        </div>

        <div className="w-full sm:w-[660px]">
          {resultMode ? (
            <ButtonCopyToClipboard textToCopy={answer} />
          ) : (
            <div name="spacer" className="mt-1 sm:mt-12" />
          )}

          <div className="overflow-y-auto border-2 p-4 mx-2 h-36 sm:h-screen sm:h-screen bg-white overflow-hidden shadow-sm sm:rounded-lg">
            <div className="text-gray-5/6">
              {message && answer && TextWithEdits(message, answer)}
            </div>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
