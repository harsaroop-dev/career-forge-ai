"use client";

import { useState } from "react";
import axios from "axios";
import {
  Send,
  Cpu,
  Target,
  Rocket,
  Zap,
  BrainCircuit,
  LayoutGrid,
  RefreshCcw,
} from "lucide-react";
import FileUpload from "./components/FileUpload";

export default function CareerForge() {
  const [jd, setJd] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [roadmap, setRoadmap] = useState<any>(null);
  const [loadingRoadmap, setLoadingRoadmap] = useState(false);

  const handleAnalyze = async () => {
    if (!jd) return;
    setLoading(true);
    try {
      const response = await axios.post("http://localhost:8000/analyze", {
        job_description: jd,
      });
      setResult(response.data);
    } catch (error) {
      console.error("Analysis failed", error);
      alert("Backend is offline. Run 'python main.py' in the backend folder.");
    } finally {
      setLoading(false);
    }
  };

  const fetchRoadmap = async () => {
    if (roadmap) return;
    setLoadingRoadmap(true);
    try {
      const response = await axios.post(
        "http://localhost:8000/generate-roadmap",
        {
          project_idea: result.strategic_project_idea,
          technical_gaps: result.technical_gaps,
        }
      );
      setRoadmap(response.data.phases);
    } catch (error) {
      console.error("Roadmap generation failed", error);
    } finally {
      setLoadingRoadmap(false);
    }
  };

  const handleReset = () => {
    setJd("");
    setResult(null);
    setRoadmap(null);
    setLoading(false);
    setLoadingRoadmap(false);
  };

  return (
    <main className="min-h-screen bg-[#050505] text-white p-6 lg:p-12 font-sans">
      {/* Header Section */}
      <header className="max-w-7xl mx-auto flex items-center justify-between mb-12 text-blue-100">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2.5 rounded-xl shadow-lg shadow-blue-500/20">
            <Cpu size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-black tracking-tighter italic">
            CAREERFORGE <span className="text-blue-500 not-italic">AI</span>
          </h1>
        </div>
      </header>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Input */}
        <div className="lg:col-span-5 space-y-8">
          <div className="bg-[#0f0f0f] border border-white/5 p-1 rounded-3xl overflow-hidden shadow-2xl">
            <FileUpload />
          </div>

          <div className="bg-[#0f0f0f] border border-white/5 p-8 rounded-3xl shadow-2xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center">
                <Target size={16} className="text-blue-400" />
              </div>
              <h2 className="text-sm font-bold uppercase tracking-widest text-white/70">
                Job Description
              </h2>
            </div>
            <textarea
              className="w-full h-72 bg-black/40 border border-white/5 rounded-2xl p-5 text-sm text-gray-300 focus:ring-1 focus:ring-blue-500/50 outline-none transition-all resize-none placeholder:text-white/10"
              placeholder="Paste the target role requirements here..."
              value={jd}
              onChange={(e) => {
                setJd(e.target.value);
                if (result) setResult(null);
                if (roadmap) setRoadmap(null);
              }}
            />

            <div className="flex gap-4 mt-6">
              <button
                onClick={handleAnalyze}
                disabled={loading}
                className="flex-[2] bg-blue-600 hover:bg-blue-500 disabled:bg-blue-900/50 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 shadow-xl shadow-blue-600/10"
              >
                {loading ? (
                  <div className="flex items-center gap-2 text-white">
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    FORGING...
                  </div>
                ) : (
                  <>
                    RUN ENGINE{" "}
                    <Send
                      size={14}
                      className="group-hover:translate-x-1 transition-transform"
                    />
                  </>
                )}
              </button>

              <button
                onClick={handleReset}
                className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2"
              >
                <RefreshCcw size={12} /> RESET
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Analysis */}
        <div className="lg:col-span-7">
          {!result ? (
            <div className="h-full min-h-[600px] flex flex-col items-center justify-center bg-[#0f0f0f] border border-white/5 rounded-[40px] text-center p-12">
              <div className="relative mb-8">
                <div className="absolute inset-0 bg-blue-500 blur-3xl opacity-10 animate-pulse"></div>
                <LayoutGrid size={64} className="text-white/5 relative" />
              </div>
              <p className="text-white/20 font-medium tracking-wide max-w-xs uppercase text-[10px] tracking-[0.2em]">
                System Standby. Awaiting Data Input for Neural Analysis.
              </p>
            </div>
          ) : (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-1000">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-[#0f0f0f] border border-white/5 p-8 rounded-[32px] flex flex-col items-center justify-center relative overflow-hidden">
                  <div className="relative w-40 h-40">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle
                        cx="80"
                        cy="80"
                        r="70"
                        stroke="currentColor"
                        strokeWidth="8"
                        fill="transparent"
                        className="text-white/5"
                      />
                      <circle
                        cx="80"
                        cy="80"
                        r="70"
                        stroke="currentColor"
                        strokeWidth="8"
                        fill="transparent"
                        strokeDasharray={440}
                        strokeDashoffset={
                          440 - (440 * result.match_score) / 100
                        }
                        className="text-blue-500 transition-all duration-1000 ease-out"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-5xl font-black tracking-tighter">
                        {result.match_score}
                      </span>
                      <span className="text-[10px] font-bold text-blue-400 tracking-[0.2em] uppercase">
                        Match %
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-[#0f0f0f] border border-white/5 p-8 rounded-[32px] flex flex-col">
                  <div className="flex items-center gap-2 mb-4">
                    <BrainCircuit size={16} className="text-purple-400" />
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">
                      AI Insights
                    </h3>
                  </div>
                  <p className="text-sm text-gray-400 leading-relaxed italic">
                    "{result.professional_assessment}"
                  </p>
                </div>
              </div>

              <div className="bg-[#0f0f0f] border border-white/5 p-8 rounded-[32px]">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                  <div>
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-green-500 mb-4 flex items-center gap-2">
                      <Zap size={14} /> Core Strength
                    </h4>
                    <p className="text-sm text-gray-300 font-medium">
                      {result.key_strength}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-red-500 mb-4">
                      Targeted Gaps
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {result.technical_gaps.map((gap: string, i: number) => (
                        <span
                          key={i}
                          className="px-3 py-1 bg-white/5 border border-white/5 rounded-full text-[10px] font-bold text-gray-400 uppercase tracking-wider"
                        >
                          {gap}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-[#0f0f0f] p-10 rounded-[31px] relative overflow-hidden border border-white/5">
                <Rocket
                  size={120}
                  className="absolute -bottom-8 -right-8 text-white/[0.02] -rotate-12"
                />
                <h3 className="text-blue-400 font-black text-[10px] uppercase tracking-[0.3em] mb-6">
                  Strategic Gap Closer
                </h3>
                <p className="text-xl font-bold text-white/90 leading-tight mb-8 max-w-md">
                  {result.strategic_project_idea}
                </p>

                <button
                  onClick={fetchRoadmap}
                  disabled={loadingRoadmap}
                  className="bg-blue-600 hover:bg-blue-500 disabled:bg-blue-900/50 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl shadow-blue-600/20"
                >
                  {loadingRoadmap
                    ? "ANALYZING ARCHITECTURE..."
                    : roadmap
                    ? "ROADMAP GENERATED"
                    : "View Roadmap"}
                </button>

                {(loadingRoadmap || roadmap) && (
                  <div className="mt-8 pt-8 border-t border-white/5 space-y-6 animate-in slide-in-from-top-4 duration-500">
                    {loadingRoadmap
                      ? [1, 2, 3].map((i) => (
                          <div key={i} className="flex gap-4 animate-pulse">
                            <div className="w-1 bg-white/5 rounded-full" />
                            <div className="space-y-2">
                              <div className="h-3 w-24 bg-white/10 rounded" />
                              <div className="h-2 w-48 bg-white/5 rounded" />
                            </div>
                          </div>
                        ))
                      : roadmap.map((phase: any, idx: number) => (
                          <div key={idx} className="flex gap-4 group">
                            <div className="w-1 bg-blue-500/30 group-hover:bg-blue-500 transition-colors rounded-full" />
                            <div>
                              <h5 className="text-[10px] font-black text-blue-400 uppercase tracking-tighter mb-1">
                                {phase.title}
                              </h5>
                              <p className="text-xs text-gray-400 leading-relaxed">
                                {phase.task}
                              </p>
                            </div>
                          </div>
                        ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
