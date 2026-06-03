import React, { useState } from 'react';
import { useTournament, CHARACTER_LIST } from '../store';
import { Play, CheckCircle2, ChevronRight, Trophy, X, RotateCcw } from 'lucide-react';
import { Player, Team, MatchSet } from '../types';

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
  isAdmin: boolean;
}

export const MatchModal = ({ matchId, onClose, isAdmin }: MatchModalProps) => {
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

  const handleSubmitResult = (setIndex: number, team1PlayerId: string, team2PlayerId: string, winnerTeamId: string, team1Character: string, team2Character: string, team1Rounds: number, team2Rounds: number) => {
    dispatch({
      type: 'SUBMIT_SET_RESULT',
      payload: { matchId: activeMatch.id, setIndex, team1PlayerId, team2PlayerId, winnerTeamId, team1Character, team2Character, team1Rounds, team2Rounds }
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

  // Determine round display name based on ID patterns and match properties
  const getRoundDisplay = () => {
    if (activeMatch.isGroupStage) {
      const gName = activeMatch.groupName || 'A';
      const mIdx = activeMatch.id.includes('_') ? activeMatch.id.substring(activeMatch.id.lastIndexOf('_') + 1) : (activeMatch.matchIndex + 1);
      return `조별리그 ${gName}조 - 경기 ${mIdx}`;
    }
    
    if (activeMatch.id.startsWith('QF_') || (activeMatch.round === 0 && !activeMatch.isGroupStage)) {
      const qfNum = activeMatch.id.includes('_') ? activeMatch.id.substring(activeMatch.id.lastIndexOf('_') + 1) : (activeMatch.matchIndex + 1);
      return `준준결승 (8강 토너먼트) - 경기 ${qfNum}`;
    }
    
    if (activeMatch.id.startsWith('SF_') || (activeMatch.round === 1 && !activeMatch.isGroupStage)) {
      const sfNum = activeMatch.id.includes('_') ? activeMatch.id.substring(activeMatch.id.lastIndexOf('_') + 1) : (activeMatch.matchIndex + 1);
      return `준결승전 (4강 토너먼트) - 경기 ${sfNum}`;
    }
    
    if (activeMatch.id.startsWith('GF_') || activeMatch.id === 'GF_1' || activeMatch.nextMatchId === null) {
      return '그랜드 파이널 (결승전)';
    }

    return `${activeMatch.round + 1}라운드 - 경기 ${activeMatch.matchIndex + 1}`;
  };

  const roundName = getRoundDisplay();

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
                  isAdmin={isAdmin}
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
  set, setIndex, team1, team2, playedByTeam1, playedByTeam2, isDeciderSet, isLocked, isCurrent, matchType, prevSet, onSubmitResult, onResetSet, isAdmin
}: any) => {
  const [t1Player, setT1Player] = useState<string>(set.team1PlayerId || '');
  const [t2Player, setT2Player] = useState<string>(set.team2PlayerId || '');
  const [t1Char, setT1Char] = useState<string>(set.team1Character || '');
  const [t2Char, setT2Char] = useState<string>(set.team2Character || '');
  const [t1Rounds, setT1Rounds] = useState<number>(set.team1Rounds || 0);
  const [t2Rounds, setT2Rounds] = useState<number>(set.team2Rounds || 0);

  // Track the actual property values of our set props that we last used to populate local state.
  const lastPropsRef = React.useRef({
    id: set.id,
    team1PlayerId: set.team1PlayerId || '',
    team2PlayerId: set.team2PlayerId || '',
    team1Character: set.team1Character || '',
    team2Character: set.team2Character || '',
    team1Rounds: set.team1Rounds || 0,
    team2Rounds: set.team2Rounds || 0,
    isCurrent,
    prevSetWinnerId: prevSet?.winnerTeamId || null,
    prevSetT1Player: prevSet?.team1PlayerId || null,
    prevSetT2Player: prevSet?.team2PlayerId || null,
  });

  React.useEffect(() => {
    const isIdChanged = lastPropsRef.current.id !== set.id;
    const isT1PChanged = lastPropsRef.current.team1PlayerId !== (set.team1PlayerId || '');
    const isT2PChanged = lastPropsRef.current.team2PlayerId !== (set.team2PlayerId || '');
    const isT1CChanged = lastPropsRef.current.team1Character !== (set.team1Character || '');
    const isT2CChanged = lastPropsRef.current.team2Character !== (set.team2Character || '');
    const isT1RChanged = lastPropsRef.current.team1Rounds !== (set.team1Rounds || 0);
    const isT2RChanged = lastPropsRef.current.team2Rounds !== (set.team2Rounds || 0);
    const isCurrentChanged = lastPropsRef.current.isCurrent !== isCurrent;
    const isPrevWinnerChanged = lastPropsRef.current.prevSetWinnerId !== (prevSet?.winnerTeamId || null);
    const isPrevT1Changed = lastPropsRef.current.prevSetT1Player !== (prevSet?.team1PlayerId || null);
    const isPrevT2Changed = lastPropsRef.current.prevSetT2Player !== (prevSet?.team2PlayerId || null);

    if (
      isIdChanged || 
      isT1PChanged || 
      isT2PChanged || 
      isT1CChanged || 
      isT2CChanged || 
      isT1RChanged || 
      isT2RChanged || 
      isCurrentChanged || 
      isPrevWinnerChanged || 
      isPrevT1Changed || 
      isPrevT2Changed
    ) {
      if (isIdChanged) {
        setT1Player(set.team1PlayerId || '');
        setT2Player(set.team2PlayerId || '');
        setT1Char(set.team1Character || '');
        setT2Char(set.team2Character || '');
        setT1Rounds(set.team1Rounds || 0);
        setT2Rounds(set.team2Rounds || 0);
      } else {
        if (set.team1PlayerId) setT1Player(set.team1PlayerId);
        if (set.team2PlayerId) setT2Player(set.team2PlayerId);
        if (set.team1Character) setT1Char(set.team1Character);
        if (set.team1Rounds !== undefined) setT1Rounds(set.team1Rounds);
        if (set.team2Rounds !== undefined) setT2Rounds(set.team2Rounds);
      }
      
      if (isCurrent && matchType === 'winners' && prevSet && prevSet.winnerTeamId) {
        if (prevSet.winnerTeamId === team1.id && !t1Player && !set.team1PlayerId) {
          setT1Player(prevSet.team1PlayerId || '');
          setT1Char(prevSet.team1Character || '');
        }
        if (prevSet.winnerTeamId === team2.id && !t2Player && !set.team2PlayerId) {
          setT2Player(prevSet.team2PlayerId || '');
          setT2Char(prevSet.team2Character || '');
        }
      }

      lastPropsRef.current = {
        id: set.id,
        team1PlayerId: set.team1PlayerId || '',
        team2PlayerId: set.team2PlayerId || '',
        team1Character: set.team1Character || '',
        team2Character: set.team2Character || '',
        team1Rounds: set.team1Rounds || 0,
        team2Rounds: set.team2Rounds || 0,
        isCurrent,
        prevSetWinnerId: prevSet?.winnerTeamId || null,
        prevSetT1Player: prevSet?.team1PlayerId || null,
        prevSetT2Player: prevSet?.team2PlayerId || null,
      };
    }
  }, [set.id, set.team1PlayerId, set.team2PlayerId, set.team1Character, set.team2Character, set.team1Rounds, set.team2Rounds, isCurrent, matchType, prevSet, team1.id, team2.id]);

  const t1Available = team1.players.filter((p: Player) => isDeciderSet || !playedByTeam1.has(p.id) || (matchType === 'winners' && p.id === t1Player));
  const t2Available = team2.players.filter((p: Player) => isDeciderSet || !playedByTeam2.has(p.id) || (matchType === 'winners' && p.id === t2Player));

  const t1PlayerName = team1.players.find((p: Player) => p.id === set.team1PlayerId)?.name || '';
  const t2PlayerName = team2.players.find((p: Player) => p.id === set.team2PlayerId)?.name || '';

  const handleSaveSet = () => {
    if (t1Player && t2Player && t1Char && t2Char) {
      const winnerId = t1Rounds > t2Rounds ? team1.id : team2.id;
      onSubmitResult(setIndex, t1Player, t2Player, winnerId, t1Char, t2Char, t1Rounds, t2Rounds);
    }
  };

  const isFormValid = t1Player && t2Player && t1Char && t2Char && (t1Rounds >= 3 || t2Rounds >= 3) && (t1Rounds !== t2Rounds);

  return (
    <div 
      style={{ zIndex: 30 - setIndex }}
      className={`glass-panel px-4 py-2.5 flex items-center relative focus-within:z-50 transition-all ${isCurrent ? 'active-match match-box bg-[#1c080b]/30' : 'opacity-70'} ${isLocked && !set.winnerTeamId ? 'opacity-30 grayscale pointer-events-none' : ''}`}
    >
      {/* Set number button (Click to reset) */}
      <button 
        type="button"
        onClick={(isAdmin && set.winnerTeamId) ? () => onResetSet(setIndex) : undefined}
        disabled={!isAdmin || !set.winnerTeamId}
        className={`w-14 shrink-0 flex flex-col items-center justify-center border-r border-hairline/30 pr-3 mr-3 transition-all group/set select-none ${(isAdmin && set.winnerTeamId) ? 'cursor-pointer hover:bg-primary/20 rounded py-1 border-r-0' : ''}`}
        title={isAdmin && set.winnerTeamId ? "이 세트 정보 수정하기 (초기화)" : ""}
      >
        <span className="text-[8px] font-bold tracking-widest text-[#e11d48] uppercase group-hover/set:text-primary-hover transition-colors">Set</span>
        <span className="text-[15px] font-mono font-bold text-white group-hover/set:text-primary-hover transition-colors">{setIndex + 1}</span>
        {isAdmin && set.winnerTeamId && (
          <span className="text-[7.5px] font-bold text-primary animate-pulse group-hover/set:text-white transition-opacity select-none">수정 ↺</span>
        )}
      </button>
      
      {!set.winnerTeamId ? (
        !isAdmin ? (
          <div className="flex-1 flex items-center justify-center py-2 text-[#e11d48]/50 font-mono text-[10px] tracking-wider uppercase bg-[#1a0507]/20 border border-[#e11d48]/10 rounded-lg select-none">
            <svg className="w-3.5 h-3.5 mr-1.5 animate-pulse text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
            세트 대기 중 (Awaiting Play)
          </div>
        ) : (
          <div className="flex-1 flex items-center gap-3">
            {/* Team 1 Controls: Player, Character, Score */}
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

               <div className="flex items-center gap-1 shrink-0">
                  <input 
                    type="text"
                    inputMode="numeric"
                    className="w-10 glass-input text-center text-xs font-bold text-white p-1"
                    value={t1Rounds === 0 ? '' : t1Rounds}
                    placeholder="0"
                    onChange={e => {
                      const val = e.target.value.replace(/[^0-9]/g, '').slice(-1);
                      const num = parseInt(val) || 0;
                      setT1Rounds(Math.min(3, num));
                    }}
                    disabled={isLocked || !!set.winnerTeamId}
                  />
               </div>
            </div>
            
            <div className="px-1 shrink-0 flex flex-col items-center justify-center gap-1">
               <div className="text-[10px] font-bold text-primary select-none opacity-60">VS</div>
               <button 
                  disabled={!isFormValid} 
                  onClick={handleSaveSet}
                  className={`px-3 py-1 rounded-[4px] text-[10px] font-black cursor-pointer shrink-0 transition-all ${
                    isFormValid 
                      ? 'bg-red-600 text-white hover:bg-red-500 border border-red-400 shadow-[0_0_12px_rgba(220,38,38,0.4)]' 
                      : 'bg-surface-2 text-ink-subtle opacity-40 cursor-not-allowed'
                  }`}
                >
                  SAVE
                </button>
            </div>

            {/* Team 2 Controls: Score, Player, Character */}
            <div className="flex-1 flex items-center gap-2 justify-end">
               <div className="flex items-center gap-1 shrink-0">
                  <input 
                    type="text"
                    inputMode="numeric"
                    className="w-10 glass-input text-center text-xs font-bold text-white p-1"
                    value={t2Rounds === 0 ? '' : t2Rounds}
                    placeholder="0"
                    onChange={e => {
                      const val = e.target.value.replace(/[^0-9]/g, '').slice(-1);
                      const num = parseInt(val) || 0;
                      setT2Rounds(Math.min(3, num));
                    }}
                    disabled={isLocked || !!set.winnerTeamId}
                  />
               </div>

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
        )
      ) : (
        /* Completed view (One pure compact row) */
        <div className="flex-grow flex items-center justify-between px-2 text-xs">
            {/* Team 1 Finished */}
            <div className={`flex-1 flex items-center gap-1.5 ${set.winnerTeamId === team1.id ? 'text-white font-black' : 'text-zinc-300 line-through opacity-90'}`}>
              <span className="text-md font-titular">{t1PlayerName}</span>
              {set.team1Character && (
                <span className={`text-[10px] font-mono px-1.5 py-0.5 bg-black/20 rounded ${set.winnerTeamId === team1.id ? 'text-white/80' : 'text-zinc-500'}`}>
                  {set.team1Character}
                </span>
              )}
            </div>
            
            {/* Versus complete status with Rounds Score */}
            <div className="shrink-0 flex items-center gap-2 px-4">
               <span className={`text-xl font-mono font-black ${set.winnerTeamId === team1.id ? 'text-white' : 'text-zinc-500'}`}>{set.team1Rounds}</span>
               {set.winnerTeamId === team1.id ? (
                 <ChevronRight className="w-4 h-4 text-white animate-pulse" />
               ) : (
                 <ChevronRight className="w-4 h-4 text-zinc-500 rotate-180" />
               )}
               <span className={`text-xl font-mono font-black ${set.winnerTeamId === team2.id ? 'text-white' : 'text-zinc-500'}`}>{set.team2Rounds}</span>
            </div>
            
            {/* Team 2 Finished */}
            <div className={`flex-1 flex items-center justify-end gap-1.5 text-right ${set.winnerTeamId === team2.id ? 'text-white font-black' : 'text-zinc-300 line-through opacity-90'}`}>
              {set.team2Character && (
                <span className={`text-[10px] font-mono px-1.5 py-0.5 bg-black/20 rounded ${set.winnerTeamId === team2.id ? 'text-white/80' : 'text-zinc-500'}`}>
                  {set.team2Character}
                </span>
              )}
              <span className="text-md font-titular">{t2PlayerName}</span>
            </div>
        </div>
      )}
    </div>
  );
};
