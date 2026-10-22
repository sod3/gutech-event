"use client";
import { useEffect, useState } from "react";
import {
  ArrowUpRight,
  Download,
  FileText,
  ListChecks,
  Trophy,
} from "lucide-react";
import { CRITERIA, type Submission } from "@/lib/types";
import { api, EmptyState, FormMessage, LoadingButton } from "./ui";
import { Workspace } from "./workspace";
type JudgeData = {
  teams: {
    id: string;
    name: string;
    registrationId: string;
    submission: Submission;
    startupStage?: string;
    startupDescription?: string;
  }[];
  scores: { teamId: string; scores: number[]; feedback: string }[];
  resultsPublished: boolean;
};
export function Judge({ name }: { name: string }) {
  const [data, setData] = useState<JudgeData | null>(null);
  const [selected, setSelected] = useState("");
  const [scores, setScores] = useState([0, 0, 0, 0, 0, 0]);
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState("projects");
  useEffect(() => {
    api<JudgeData>("/api/judge")
      .then(setData)
      .catch((e) =>
        setError(e instanceof Error ? e.message : "Unable to load projects."),
      );
  }, []);
  const choose = (teamId: string) => {
    setSelected(teamId);
    const score = data?.scores.find((s) => s.teamId === teamId);
    setScores(score?.scores || [0, 0, 0, 0, 0, 0]);
    setFeedback(score?.feedback || "");
    setError("");
    setMessage("");
  };
  const project = data?.teams.find((t) => t.id === selected);
  const save = async () => {
    setBusy(true);
    setError("");
    try {
      const r = await api<{ message: string }>("/api/judge", "POST", {
        teamId: selected,
        scores,
        feedback,
      });
      setMessage(r.message);
      setData(await api<JudgeData>("/api/judge"));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to save scores.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <Workspace
      title="JUDGE WORKSPACE"
      name={name}
      tabs={[
        { id: "projects", title: "Assigned startups", icon: FileText },
        { id: "rubric", title: "Judging rubric", icon: ListChecks },
      ]}
      active={tab}
      onTab={setTab}
    >
      <div className="workspace-heading">
        <div>
          <h1>
            {tab === "rubric"
              ? "A fair chance for every idea."
              : "Find the ideas with impact."}
          </h1>
          <p>
            Score the problem, originality, and practical potential · 100 points
          </p>
        </div>
      </div>
      {tab === "rubric" ? (
        <div className="workspace-card">
          {CRITERIA.map((c) => (
            <div className="project-preview" key={c.name}>
              <h3>
                {c.name} · {c.points} points
              </h3>
              <p>{c.description}</p>
            </div>
          ))}
          <p className="payment-help">
            A working product is not required. Review each startup’s idea,
            target customers, and pitch deck in the context of its current
            stage.
          </p>
        </div>
      ) : (
        <>
          <div className="workspace-card">
            <div className="card-header">
              <h2>Your assigned startups</h2>
              <span>{data?.teams.length || 0} TEAMS</span>
            </div>
            {data?.teams.length ? (
              data.teams.map((t) => (
                <div className="judge-assignment" key={t.id}>
                  <div>
                    <h3>
                      {t.name} · {t.submission.title || "Project in progress"}
                    </h3>
                    <p>
                      {t.registrationId} ·{" "}
                      {t.submission.final ? "FINAL SUBMISSION" : "DRAFT"}
                    </p>
                  </div>
                  <button
                    className="text-link"
                    style={{ fontSize: 12 }}
                    onClick={() => choose(t.id)}
                  >
                    {data.scores.some((s) => s.teamId === t.id)
                      ? "Review score"
                      : "Open startup"}
                    <ArrowUpRight size={12} />
                  </button>
                </div>
              ))
            ) : (
              <EmptyState
                icon={<FileText size={20} />}
                title={
                  data
                    ? "Your next great idea is on its way."
                    : "Loading assigned projects…"
                }
              >
                Organizers will assign shortlisted startups for you to review
                here.
              </EmptyState>
            )}
          </div>
          {project && (
            <div className="dashboard-grid">
              <div className="workspace-card project-preview">
                <div className="card-header">
                  <h2>{project.submission.title || project.name}</h2>
                  <FileText size={15} />
                </div>
                {[
                  ["Startup stage", project.startupStage],
                  ["Startup description", project.startupDescription],
                  ["Problem statement", project.submission.problem],
                  ["Solution & uniqueness", project.submission.solution],
                  ["Research & validation", project.submission.research],
                  ["AI assistance", project.submission.aiTools],
                ].map(([label, text]) => (
                  <div key={label}>
                    <h3>{label}</h3>
                    <p>{text || "Not provided"}</p>
                  </div>
                ))}
                {project.submission.mvpUrl && (
                  <a
                    className="text-link"
                    href={project.submission.mvpUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    MVP / prototype <ArrowUpRight size={12} />
                  </a>
                )}
                {project.submission.pitchUrl && (
                  <a
                    className="text-link"
                    href={project.submission.pitchUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Pitch presentation <ArrowUpRight size={12} />
                  </a>
                )}
                {project.submission.deckFileId && (
                  <a
                    className="text-link"
                    href={`/api/files/${project.submission.deckFileId}`}
                  >
                    Download pitch deck <Download size={12} />
                  </a>
                )}
              </div>
              <div className="workspace-card">
                <div className="card-header">
                  <h2>Your scorecard</h2>
                  <Trophy size={16} />
                </div>
                {CRITERIA.map((c, i) => (
                  <div className="score-input" key={c.name}>
                    <label htmlFor={`judge-score-${i}`}>{c.name}</label>
                    <div>
                      <input
                        id={`judge-score-${i}`}
                        type="number"
                        min={0}
                        max={c.points}
                        value={scores[i]}
                        disabled={
                          data?.resultsPublished || !project.submission.final
                        }
                        onChange={(e) =>
                          setScores((prev) =>
                            prev.map((v, j) =>
                              i === j ? Number(e.target.value) : v,
                            ),
                          )
                        }
                      />
                      <span>/ {c.points}</span>
                    </div>
                  </div>
                ))}
                <div className="score-total">
                  <span>Total score</span>
                  <strong>
                    {scores.reduce((a, b) => a + b, 0)}
                    <small style={{ fontSize: 12 }}> / 100</small>
                  </strong>
                </div>
                <div className="field" style={{ marginTop: 20 }}>
                  <label htmlFor="judge-feedback">
                    Feedback for organizers
                  </label>
                  <textarea
                    id="judge-feedback"
                    maxLength={3000}
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    disabled={
                      data?.resultsPublished || !project.submission.final
                    }
                  />
                </div>
                <LoadingButton
                  busy={busy}
                  style={{ marginTop: 21, width: "100%" }}
                  disabled={data?.resultsPublished || !project.submission.final}
                  onClick={save}
                >
                  Save scorecard
                </LoadingButton>
                {(data?.resultsPublished || !project.submission.final) && (
                  <p className="payment-help">
                    {data?.resultsPublished
                      ? "Results have been published. Scorecards are locked."
                      : "Scoring opens when the team confirms their final submission."}
                  </p>
                )}
              </div>
            </div>
          )}
        </>
      )}
      <FormMessage error={error} message={message} />
    </Workspace>
  );
}
