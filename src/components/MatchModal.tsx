import React, { useState } from 'react';
import { useTournament } from '../store';
import { Play, CheckCircle2, ChevronRight, Trophy, X, RotateCcw } from 'lucide-react';
import { Player, Team, MatchSet } from '../types';

const CHARACTER_LIST = [
  "아수세나", "빅터", "레이나", "카자마 준", "니나 윌리엄스", 
  "미시마 카즈야", "카자마 진", "폴 피닉스", "마샬 로우", "잭-8", 
  "라스 알렉산더슨", "링 샤오유", "리로이 스미스", "아스카 카자마", 
  "에밀리 드 로슈포르(릴리)", "브라이언 퓨리", "화랑", "클라우디오 세라피노", 
  "레이븐", "레오 클리젠", "스티브 폭스", "쿠마", "요시미츠", "샤힌", 
  "세르게이 드라구노프", "펭 웨이", "팬더", "리 차오롱", "알리사 보스코노비치", 
  "자피나", "데빌 진", "에디 골드"
];

const CharacterSelect = ({ value, onChange, placeholder, disabled }: { value: string; onChange: (v: string) => void; placeholder: string; disabled?: boolean }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState(value || '');
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    setSearch(value || '');
  }, [value]);

  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSearch(value || '');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [value]);

  const filtered = CHARACTER_LIST.filter(char => 
    char.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div ref={containerRef} className="relative w-full min-w-[125px] max-w-[150px]">
      <input
        type="text"
        className="glass-input text-xs text-white placeholder-ink-tertiary focus:border-primary disabled:opacity-40"
        placeholder={placeholder}
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        disabled={disabled}
      />
      {isOpen && !disabled && (
        <div className="absolute left-0 right-0 mt-1 max-h-40 overflow-y-auto bg-[#14181d] border border-hairline/80 rounded shadow-2xl z-40 scrollbar-hidden">
          {filtered.length > 0 ? (
            filtered.map((char) => (
              <button
                key={char}
                type="button"
                onClick={() => {
                  onChange(char);
                  setSearch(char);
                  setIsOpen(false);
                }}
                className="w-full text-left px-3 py-1.5 text-xs text-ink hover:bg-primary/20 hover:text-white transition-all border-b border-hairline/10 block"
              >
                {char}
              </button>
            ))
          ) : (
            <div className="px-3 py-2 text-xs text-ink-tertiary">일치하는 캐릭터 없음</div>
          )}
        </div>
      )}
    </div>
  );
};

interface MatchModalProps {
  matchId: string;
  onClose: () => void;
}

export const MatchModal = ({ matchId, onClose }: MatchModalProps) => {
  const { state, dispatch } = useTournament();
  
  const activeMatch = state.matches.find(m => m.id === matchId);
  const team1 = activeMatch ? state.teams.find(t => t.id === activeMatch.team1Id) : null;
  const team2 = activeMatch ? state.teams.find(t => t.id === activeMatch.team2Id) : null;

  const currentSetsToWin = activeMatch ? (activeMatch.isGroupStage ? 3 : state.settings.setsToWin) : 4;

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!activeMatch || !team1 || !team2) {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
        <div className="glass-panel p-8 rounded-xl max-w-md w-full text-center border-hairline relative">
          <button onClick={onClose} className="absolute top-4 right-4 text-ink-subtle hover:text-white">
            <X className="w-5 h-5" />
          </button>
          <p className="text-ink-subtle">유효하지 않거나 아직 대진 상대가 결정되지 않은 매치입니다.</p>
        </div>
      </div>
    );
  }

  const handleSubmitResult = (setIndex: number, team1PlayerId: string, team2PlayerId: string, winnerTeamId: string, team1Character: string, team2Character: string) => {
    dispatch({
      type: 'SUBMIT_SET_RESULT',
      payload: { matchId: activeMatch.id, setIndex, team1PlayerId, team2PlayerId, winnerTeamId, team1Character, team2Character }
    });
  };

  const handleResetSet = (setIndex: number) => {
    dispatch({
      type: 'RESET_SET_RESULT',
      payload: { matchId: activeMatch.id, setIndex }
    });
  };

  const handleCompleteMatch = () => {
    dispatch({ type: 'COMPLETE_MATCH', payload: activeMatch.id });
    onClose();
  };

  // Determine round display name
  const isFinal = activeMatch.nextMatchId === null;
  const roundName = isFinal ? '최종 결승전 (Grand Final)' : `Round ${activeMatch.round + 1} - Match ${activeMatch.matchIndex + 1}`;

  return (
    <div 
      onClick={onClose}
      className="fixed inset-0 bg-black/85 backdrop-blur-lg flex items-center justify-center z-50 p-4 animate-fade-in overflow-y-auto cursor-pointer"
    >
      <div 
        className="w-full max-w-5xl bg-[#0c0f12] bg-[radial-gradient(circle_at_top_right,rgba(225,29,72,0.08),transparent)] border border-hairline rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden cursor-default"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <header className="p-5 border-b border-hairline flex items-center justify-between bg-[#140507]/40 backdrop-blur-md shrink-0">
          <div>
            <span className="text-xs font-bold tracking-widest text-primary uppercase block mb-0.5">LIVE TOURNAMENT MATCH</span>
            <h1 className="text-xl font-titular text-white">{roundName}</h1>
          </div>
          <button 
            onClick={onClose}
            className="w-9 h-9 rounded-full border border-hairline flex items-center justify-center text-ink-subtle hover:text-white transition-all bg-surface-1 hover:bg-surface-2"
          >
            <X className="w-5 h-5" />
          </button>
        </header>

        {/* Modal Scroll Content */}
        <div className="flex-grow overflow-y-auto p-5 scrollbar-hidden">
          {/* Scoreboard Head */}
          <div className="glass-panel p-5 rounded-xl mb-6 flex justify-between items-center relative overflow-hidden bg-gradient-to-b from-[#1c0c0e]/30 to-transparent">
             <div className="absolute inset-x-0 bottom-0 h-[2px] bg-gradient-to-r from-transparent via-primary/50 to-transparent"></div>
             {/* Team 1 View */}
             <div className="flex-1 text-center">
               <h2 className="text-xl md:text-2xl font-titular text-white mb-1">{team1.name}</h2>
               <p className="text-4xl md:text-5xl font-mono text-white text-shadow-lg font-bold">{activeMatch.team1Score}</p>
               {activeMatch.team1Score >= currentSetsToWin && (
                 <div className="mt-1 text-primary font-bold tracking-widest text-xs flex items-center justify-center gap-1">
                   <Trophy className="w-3.5 h-3.5 text-yellow-500 animate-pulse"/> WINS MATCH
                 </div>
               )}
             </div>

             <div className="px-4 py-1.5 bg-[#1a0507] rounded-full border border-primary/30 opacity-90 backdrop-blur-md">
               <span className="text-primary font-bold tracking-widest text-xs uppercase">{currentSetsToWin === 3 ? "BO5" : "BO7"}</span>
             </div>

             {/* Team 2 View */}
             <div className="flex-1 text-center">
               <h2 className="text-xl md:text-2xl font-titular text-white mb-1">{team2.name}</h2>
               <p className="text-4xl md:text-5xl font-mono text-white text-shadow-lg font-bold">{activeMatch.team2Score}</p>
               {activeMatch.team2Score >= currentSetsToWin && (
                 <div className="mt-1 text-primary font-bold tracking-widest text-xs flex items-center justify-center gap-1">
                   <Trophy className="w-3.5 h-3.5 text-yellow-500 animate-pulse"/> WINS MATCH
                 </div>
               )}
             </div>
          </div>

          {/* Complete Information Banner if match is decided */}
          {(activeMatch.team1Score >= currentSetsToWin || activeMatch.team2Score >= currentSetsToWin) && (
            <div className="mb-6 p-4 glass-panel rounded-xl flex items-center justify-between border border-emerald-500/30 bg-emerald-500/5 animate-pulse">
              <div>
                <h3 className="text-md font-bold text-white">매치 자동 종료 및 승패 반영 완료</h3>
                <p className="text-ink-subtle text-xs">한 팀이 {currentSetsToWin}승에 도달하여 경기 결과가 대진표 및 순위에 실시간 조율되어 즉시 반영되었습니다.</p>
              </div>
              <button onClick={onClose} className="px-5 py-2 cursor-pointer text-xs bg-emerald-600 hover:bg-emerald-500 border border-emerald-400 text-white rounded font-bold transition-colors">
                대진표로 돌아가기
              </button>
            </div>
          )}

          {/* Set Lists */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-ink-subtle tracking-widest uppercase mb-2 border-l-2 border-primary pl-2">세트 (Sets)</h3>
            {activeMatch.sets.map((set, sIdx) => {
              const isDeciderSet = sIdx === (currentSetsToWin === 3 ? 4 : 6);
              
              // Which players have already played?
              const playedByTeam1 = new Set(activeMatch.sets.slice(0, sIdx).map(s => s.team1PlayerId).filter(Boolean));
              const playedByTeam2 = new Set(activeMatch.sets.slice(0, sIdx).map(s => s.team2PlayerId).filter(Boolean));

              // A set is locked if a previous set hasn't been played yet, OR match is already won.
              const nextUnplayedSetIndex = activeMatch.sets.findIndex(s => s.winnerTeamId === null);
              const isLocked = (nextUnplayedSetIndex !== -1 && sIdx > nextUnplayedSetIndex) || activeMatch.status === 'completed' || 
                               activeMatch.team1Score >= currentSetsToWin || activeMatch.team2Score >= currentSetsToWin;
              
              const isCurrent = sIdx === nextUnplayedSetIndex && !isLocked;

              const prevSet = sIdx > 0 ? activeMatch.sets[sIdx - 1] : null;

              return (
                <SetRow 
                  key={set.id}
                  set={set}
                  setIndex={sIdx}
                  team1={team1}
                  team2={team2}
                  playedByTeam1={playedByTeam1}
                  playedByTeam2={playedByTeam2}
                  isDeciderSet={isDeciderSet}
                  isLocked={isLocked}
                  isCurrent={isCurrent}
                  matchType={state.settings.matchType}
                  prevSet={prevSet}
                  onSubmitResult={handleSubmitResult}
                  onResetSet={handleResetSet}
                />
               );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

// Extracted SetRow Component (Supercompact 1-Line Form)
const SetRow = ({ 
  set, setIndex, team1, team2, playedByTeam1, playedByTeam2, isDeciderSet, isLocked, isCurrent, matchType, prevSet, onSubmitResult, onResetSet
}: any) => {
  const [t1Player, setT1Player] = useState<string>(set.team1PlayerId || '');
  const [t2Player, setT2Player] = useState<string>(set.team2PlayerId || '');
  const [t1Char, setT1Char] = useState<string>(set.team1Character || '');
  const [t2Char, setT2Char] = useState<string>(set.team2Character || '');

  React.useEffect(() => {
    let defaultT1 = set.team1PlayerId || '';
    let defaultT2 = set.team2PlayerId || '';
    let defaultT1Char = set.team1Character || '';
    let defaultT2Char = set.team2Character || '';
    
    // Auto-select winner if winners mode and no player is selected yet
    if (isCurrent && matchType === 'winners' && prevSet && prevSet.winnerTeamId) {
      if (prevSet.winnerTeamId === team1.id && !defaultT1) {
        defaultT1 = prevSet.team1PlayerId || '';
        defaultT1Char = prevSet.team1Character || '';
      }
      if (prevSet.winnerTeamId === team2.id && !defaultT2) {
        defaultT2 = prevSet.team2PlayerId || '';
        defaultT2Char = prevSet.team2Character || '';
      }
    }
    
    setT1Player(defaultT1);
    setT2Player(defaultT2);
    setT1Char(defaultT1Char);
    setT2Char(defaultT2Char);
  }, [set.team1PlayerId, set.team2PlayerId, set.team1Character, set.team2Character, isCurrent, matchType, prevSet, team1.id, team2.id]);

  const t1Available = team1.players.filter((p: Player) => isDeciderSet || !playedByTeam1.has(p.id) || (matchType === 'winners' && p.id === t1Player));
  const t2Available = team2.players.filter((p: Player) => isDeciderSet || !playedByTeam2.has(p.id) || (matchType === 'winners' && p.id === t2Player));

  const t1PlayerName = team1.players.find((p: Player) => p.id === set.team1PlayerId)?.name || '';
  const t2PlayerName = team2.players.find((p: Player) => p.id === set.team2PlayerId)?.name || '';

  const handleWin = (winnerId: string) => {
    if (t1Player && t2Player) {
      onSubmitResult(setIndex, t1Player, t2Player, winnerId, t1Char, t2Char);
    }
  };

  const isFormValid = t1Player && t2Player && t1Char && t2Char;

  return (
    <div 
      style={{ zIndex: 30 - setIndex }}
      className={`glass-panel px-4 py-2.5 flex items-center relative focus-within:z-50 transition-all ${isCurrent ? 'active-match match-box bg-[#1c080b]/30' : 'opacity-70'} ${isLocked && !set.winnerTeamId ? 'opacity-30 grayscale pointer-events-none' : ''}`}
    >
      {/* Set number button (Click to reset) */}
      <button 
        type="button"
        onClick={set.winnerTeamId ? () => onResetSet(setIndex) : undefined}
        disabled={!set.winnerTeamId}
        className={`w-14 shrink-0 flex flex-col items-center justify-center border-r border-hairline/30 pr-3 mr-3 transition-all group/set select-none ${set.winnerTeamId ? 'cursor-pointer hover:bg-primary/20 rounded py-1 border-r-0' : ''}`}
        title={set.winnerTeamId ? "이 세트 정보 수정하기 (초기화)" : ""}
      >
        <span className="text-[8px] font-bold tracking-widest text-[#e11d48] uppercase group-hover/set:text-primary-hover transition-colors">Set</span>
        <span className="text-[15px] font-mono font-bold text-white group-hover/set:text-primary-hover transition-colors">{setIndex + 1}</span>
        {set.winnerTeamId && (
          <span className="text-[7.5px] font-bold text-primary animate-pulse group-hover/set:text-white transition-opacity select-none">수정 ↺</span>
        )}
      </button>
      
      {!set.winnerTeamId ? (
        <div className="flex-1 flex items-center gap-3">
          {/* Team 1 Controls: Player, Character, Win Button */}
          <div className="flex-1 flex items-center gap-2">
             <div className="flex-grow min-w-[90px]">
               <select 
                 className="glass-input text-xs text-white bg-[#0e1217]" 
                 value={t1Player} 
                 onChange={e => setT1Player(e.target.value)} 
                 disabled={isLocked || !!set.winnerTeamId}
               >
                  <option value="" className="text-ink-tertiary">선수 선택</option>
                  {t1Available.map((p: Player) => (
                    <option key={p.id} value={p.id} className="text-white bg-[#0e1217]">{p.name}</option>
                  ))}
               </select>
             </div>
             
             <CharacterSelect 
               value={t1Char} 
               onChange={setT1Char} 
               placeholder="캐릭터 입력" 
               disabled={isLocked || !!set.winnerTeamId}
             />

             <button 
               disabled={!isFormValid} 
               onClick={() => handleWin(team1.id)}
               className={`px-3 py-1.5 rounded text-xs font-semibold cursor-pointer shrink-0 transition-all ${
                 isFormValid 
                   ? 'bg-primary/90 text-white hover:bg-primary border border-primary/30 shadow-[0_0_8px_rgba(225,29,72,0.25)]' 
                   : 'bg-surface-2 text-ink-subtle opacity-40 cursor-not-allowed'
               }`}
             >
               승리
             </button>
          </div>
          
          <div className="px-1 shrink-0 text-[10px] font-bold text-primary select-none opacity-60">VS</div>

          {/* Team 2 Controls: Win Button, Player, Character */}
          <div className="flex-1 flex items-center gap-2">
             <button 
               disabled={!isFormValid} 
               onClick={() => handleWin(team2.id)}
               className={`px-3 py-1.5 rounded text-xs font-semibold cursor-pointer shrink-0 transition-all ${
                 isFormValid 
                   ? 'bg-primary/90 text-white hover:bg-primary border border-primary/30 shadow-[0_0_8px_rgba(225,29,72,0.25)]' 
                   : 'bg-surface-2 text-ink-subtle opacity-40 cursor-not-allowed'
               }`}
             >
               승리
             </button>

             <div className="flex-grow min-w-[90px]">
               <select 
                 className="glass-input text-xs text-white bg-[#0e1217]" 
                 value={t2Player} 
                 onChange={e => setT2Player(e.target.value)} 
                 disabled={isLocked || !!set.winnerTeamId}
               >
                  <option value="" className="text-ink-tertiary">선수 선택</option>
                  {t2Available.map((p: Player) => (
                    <option key={p.id} value={p.id} className="text-white bg-[#0e1217]">{p.name}</option>
                  ))}
               </select>
             </div>
             
             <CharacterSelect 
               value={t2Char} 
               onChange={setT2Char} 
               placeholder="캐릭터 입력" 
               disabled={isLocked || !!set.winnerTeamId}
             />
          </div>
        </div>
      ) : (
        /* Completed view (One pure compact row) */
        <div className="flex-grow flex items-center justify-between px-2 text-xs">
            {/* Team 1 Finished */}
            <div className={`flex-1 flex items-center gap-1.5 ${set.winnerTeamId === team1.id ? 'text-primary font-bold' : 'text-ink-subtle line-through opacity-50'}`}>
              <span className="text-md font-titular">{t1PlayerName}</span>
              {set.team1Character && (
                <span className="text-[10px] font-mono text-ink-tertiary px-1.5 py-0.5 bg-black/20 rounded">
                  {set.team1Character}
                </span>
              )}
            </div>
            
            {/* Versus complete status */}
            <div className="shrink-0 flex items-center gap-2 px-4">
               {set.winnerTeamId === team1.id ? (
                 <ChevronRight className="w-4 h-4 text-primary animate-pulse" />
               ) : (
                 <ChevronRight className="w-4 h-4 text-primary rotate-180 animate-pulse" />
               )}
               <span className="text-[9px] font-mono px-2 py-0.5 bg-black/40 border border-hairline/25 rounded text-ink-muted leading-tight select-none">
                 SET CLOSED
               </span>
            </div>
            
            {/* Team 2 Finished */}
            <div className={`flex-1 flex items-center justify-end gap-1.5 text-right ${set.winnerTeamId === team2.id ? 'text-primary font-bold' : 'text-ink-subtle line-through opacity-50'}`}>
              {set.team2Character && (
                <span className="text-[10px] font-mono text-ink-tertiary px-1.5 py-0.5 bg-black/20 rounded">
                  {set.team2Character}
                </span>
              )}
              <span className="text-md font-titular">{t2PlayerName}</span>
            </div>
        </div>
      )}
    </div>
  );
}
