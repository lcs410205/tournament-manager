import React, { useState, useEffect, useRef } from 'react';
import { Trophy, Users, RefreshCw, ChevronRight, Minus, Plus, Grid, GitMerge, ArrowLeft, Trash2, PlusCircle, AlertCircle, Save, Download, FileDown, Settings, Edit3, X, Check, UserRound, Users as UsersIcon, PenLine } from 'lucide-react';

// --- 自定義確認對話框 ---
const ConfirmDialog = ({ isOpen, message, onConfirm, onCancel }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4 animate-in fade-in duration-200 print:hidden">
      <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6 transform transition-all scale-100">
        <div className="flex items-center gap-3 mb-4">
            <div className="bg-red-100 p-2 rounded-full text-red-600">
                <AlertCircle size={24} />
            </div>
            <h3 className="text-lg font-bold text-gray-900">確認操作</h3>
        </div>
        <p className="text-gray-600 mb-6 pl-1">{message}</p>
        <div className="flex justify-end gap-3">
          <button onClick={onCancel} className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-medium">取消</button>
          <button onClick={onConfirm} className="px-4 py-2 text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors font-medium shadow-sm">確定執行</button>
        </div>
      </div>
    </div>
  );
};

// --- 通用組件：比分控制器 (支援 28px small variant, 隱藏原生箭頭, 可選顯示按鈕) ---
const ScoreControl = ({ score, onChange, readOnly, colorClass, maxScore, onClick, variant = 'normal', showButtons = true }) => {
  const currentScore = score === '' ? 0 : parseInt(score);
  
  const isSmall = variant === 'small';
  // small 模式為 w-7 h-7 (28px)
  const btnSizeClass = isSmall ? 'w-7 h-7 rounded' : 'w-9 h-9 rounded-lg';
  const iconSize = isSmall ? 12 : 16;
  const inputContainerClass = isSmall ? 'h-7 min-w-[2rem] text-base' : 'h-9 min-w-[3rem] text-xl';
  const inputClass = isSmall ? 'h-7 w-8 text-base' : 'h-9 w-12 text-xl';

  const handleInputChange = (e) => {
      const val = parseInt(e.target.value);
      if (isNaN(val)) {
          onChange(0);
      } else {
          let finalVal = Math.max(0, val);
          if (maxScore > 0 && finalVal > maxScore) finalVal = maxScore;
          onChange(finalVal);
      }
  };

  return (
    <div className="flex items-center gap-0.5">
      {showButtons && !readOnly && (
        <button 
            onClick={(e) => { e.stopPropagation(); onChange(Math.max(0, currentScore - 1)); }} 
            className={`${btnSizeClass} flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-l-md transition-colors active:bg-gray-300 print:hidden`}
            title="減少"
        >
            <Minus size={iconSize} />
        </button>
      )}
      
      {onClick ? (
        <div 
            onClick={onClick}
            className={`${inputContainerClass} flex items-center justify-center font-mono font-bold border-y border-gray-200 bg-white ${colorClass} ${readOnly ? 'rounded-md border-x px-2' : ''} cursor-pointer hover:bg-blue-50 transition-colors`}
        >
            {score === '' ? '-' : score}
        </div>
      ) : (
        <input 
            type="number"
            value={score}
            onChange={handleInputChange}
            disabled={readOnly}
            className={`${inputClass} text-center font-mono font-bold border-y border-gray-200 bg-white outline-none focus:bg-blue-50 no-spin ${colorClass} ${readOnly ? 'rounded-md border-x' : ''}`}
        />
      )}

      {showButtons && !readOnly && (
        <button 
            onClick={(e) => {
                e.stopPropagation();
                if (maxScore > 0 && currentScore >= maxScore) return; 
                onChange(currentScore + 1);
            }}
            className={`${btnSizeClass} flex items-center justify-center bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-r-md transition-colors active:bg-blue-200 print:hidden ${maxScore > 0 && currentScore >= maxScore ? 'opacity-50 cursor-not-allowed' : ''}`}
            title="增加"
        >
            <Plus size={iconSize} />
        </button>
      )}
    </div>
  );
};

// --- 團體賽詳細戰況 Modal ---
const TeamMatchModal = ({ isOpen, onClose, matchData, p1Name, p2Name, pointsCount, winCondition, onSave, defaultType = 'single', p1PartnerName, p2PartnerName }) => {
    if (!isOpen) return null;

    const maxSets = winCondition === 0 ? 1 : (winCondition * 2 - 1);
    
    // 初始化或複製現有的點數資料
    const [subMatches, setSubMatches] = useState(() => {
        const initial = matchData.subMatches || [];
        const result = Array.from({ length: pointsCount }, (_, i) => {
            const isInitial = !initial[i];
            const base = initial[i] || {
                id: i,
                type: defaultType, 
                p1SubName: '', p1PartnerName: '',
                p2SubName: '', p2PartnerName: '',
                sets: Array.from({ length: maxSets }, () => ({ s1: '', s2: '' }))
            };
            
            if (isInitial && pointsCount === 1) {
                base.p1SubName = typeof p1Name === 'string' ? p1Name : '';
                base.p2SubName = typeof p2Name === 'string' ? p2Name : '';
                if (defaultType === 'double') {
                    base.p1PartnerName = p1PartnerName || '';
                    base.p2PartnerName = p2PartnerName || '';
                }
            }
            return base;
        });
        
        return result.map(m => {
            const currentSets = m.sets || [];
            if (currentSets.length !== maxSets) {
                return {
                    ...m,
                    sets: Array.from({ length: maxSets }, (_, si) => currentSets[si] || { s1: '', s2: '' })
                };
            }
            return m;
        });
    });

    const calculateSetScore = (sub) => {
        let sets1 = 0;
        let sets2 = 0;
        sub.sets.forEach(set => {
            const s1 = parseInt(set.s1);
            const s2 = parseInt(set.s2);
            if (!isNaN(s1) && !isNaN(s2)) {
                if (s1 > s2) sets1++;
                if (s2 > s1) sets2++;
            }
        });
        return { sets1, sets2 };
    };

    const calculateTotalScore = (currentSubMatches) => {
        let score1 = 0;
        let score2 = 0;
        currentSubMatches.forEach(sub => {
            const { sets1, sets2 } = calculateSetScore(sub);
            if (winCondition > 0) {
                if (sets1 >= winCondition) score1++;
                else if (sets2 >= winCondition) score2++;
            } else {
                if (sets1 > sets2) score1++;
                else if (sets2 > sets1) score2++;
            }
        });
        return { s1: score1, s2: score2 };
    };

    const currentTotal = calculateTotalScore(subMatches);

    const handleSubChange = (index, field, value) => {
        const newSub = [...subMatches];
        newSub[index][field] = value;
        setSubMatches(newSub);
    };

    const handleSetScoreChange = (subIndex, setIndex, team, value) => {
        let val = parseInt(value);
        if (isNaN(val)) val = ''; 
        else val = Math.max(0, val);

        const newSub = [...subMatches];
        newSub[subIndex].sets[setIndex][team] = val;
        setSubMatches(newSub);
    };

    const handleConfirm = () => {
        onSave(matchData.id, subMatches, currentTotal.s1, currentTotal.s2);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[150] p-4 animate-in fade-in duration-200">
            <style>{`
                .no-spin::-webkit-outer-spin-button,
                .no-spin::-webkit-inner-spin-button {
                    -webkit-appearance: none;
                    margin: 0;
                }
                .no-spin {
                    -moz-appearance: textfield;
                }
            `}</style>

            <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col overflow-hidden">
                <div className="bg-blue-600 text-white p-4 flex justify-between items-center shrink-0">
                    <h3 className="text-xl font-bold flex items-center gap-2">
                        <Edit3 size={20} /> 詳細戰況登錄
                    </h3>
                    <button onClick={onClose} className="text-white/80 hover:text-white transition-colors"><X size={24} /></button>
                </div>

                <div className="bg-blue-50 p-3 flex justify-between items-center text-blue-900 border-b border-blue-100 shrink-0">
                    <div className="font-bold text-lg flex items-center gap-4">
                        <span>{typeof p1Name === 'string' ? p1Name : '選手1'}</span> 
                        <span className="text-2xl font-mono bg-white px-4 py-1 rounded shadow-sm border border-blue-100">{currentTotal.s1} : {currentTotal.s2}</span> 
                        <span>{typeof p2Name === 'string' ? p2Name : '選手2'}</span>
                    </div>
                    <div className="text-sm bg-white px-3 py-1 rounded-full shadow-sm border border-blue-100">
                        賽制: {winCondition === 0 ? "一局決勝" : `${winCondition * 2 - 1} 戰 ${winCondition} 勝`}
                    </div>
                </div>

                <div className="p-4 overflow-y-auto bg-gray-50">
                    <div className="space-y-3">
                        <div className="grid grid-cols-[60px_80px_1fr_180px_80px_1fr] gap-2 text-sm font-bold text-gray-500 px-4 text-center items-center">
                            <div>點數</div><div>類型</div><div className="text-left pl-2">{typeof p1Name === 'string' ? p1Name : '選手1'}</div><div>各局小分</div><div>總局數</div><div className="text-right pr-2">{typeof p2Name === 'string' ? p2Name : '選手2'}</div>
                        </div>

                        {subMatches.map((sub, idx) => {
                            const { sets1, sets2 } = calculateSetScore(sub);
                            const pointWinner = winCondition > 0 
                                ? (sets1 >= winCondition ? 0 : sets2 >= winCondition ? 1 : null)
                                : (sets1 > sets2 ? 0 : sets2 > sets1 ? 1 : null);

                            const rowStyle = pointWinner !== null ? 'bg-gray-100 border-gray-300' : 'bg-white border-gray-200';
                            
                            const getP1Style = () => {
                                if (pointWinner === 0) return "bg-orange-100 border-orange-300 text-orange-800 font-bold shadow-sm";
                                if (pointWinner === 1) return "bg-transparent border-gray-300 text-gray-400";
                                return "bg-white border-gray-300 text-gray-700";
                            };
                            const getP2Style = () => {
                                if (pointWinner === 1) return "bg-orange-100 border-orange-300 text-orange-800 font-bold shadow-sm";
                                if (pointWinner === 0) return "bg-transparent border-gray-300 text-gray-400";
                                return "bg-white border-gray-300 text-gray-700";
                            };

                            return (
                                <div key={idx} className={`grid grid-cols-[60px_80px_1fr_auto_80px_1fr] gap-3 items-center p-3 rounded-lg border shadow-sm transition-colors ${rowStyle}`}>
                                    <div className="text-center font-bold text-gray-400 bg-white/50 rounded py-1 text-xs">第 {idx + 1} 點</div>
                                    
                                    <div className="relative">
                                        <select 
                                            value={sub.type}
                                            onChange={(e) => handleSubChange(idx, 'type', e.target.value)}
                                            className="w-full appearance-none bg-white border border-gray-300 text-gray-700 text-sm rounded py-1 pl-2 pr-6 focus:outline-none focus:border-blue-500 font-medium"
                                        >
                                            <option value="single">單打</option><option value="double">雙打</option>
                                        </select>
                                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-1 text-gray-500">
                                            {sub.type === 'single' ? <UserRound size={12} /> : <UsersIcon size={12} />}
                                        </div>
                                    </div>
                                    
                                    <div className="flex flex-col gap-1 items-start">
                                        <input type="text" placeholder="選手 A" value={sub.p1SubName} onChange={(e) => handleSubChange(idx, 'p1SubName', e.target.value)} className={`w-2/3 p-1.5 rounded border text-sm focus:ring-1 focus:ring-blue-400 outline-none ${getP1Style()}`} />
                                        {sub.type === 'double' && (
                                            <input type="text" placeholder="選手 B" value={sub.p1PartnerName} onChange={(e) => handleSubChange(idx, 'p1PartnerName', e.target.value)} className={`w-2/3 p-1.5 rounded border text-sm focus:ring-1 focus:ring-blue-400 outline-none ${getP1Style()}`} />
                                        )}
                                    </div>

                                    <div className="flex items-center gap-1.5 px-2">
                                        {sub.sets.map((set, sIdx) => {
                                            const s1 = parseInt(set.s1); const s2 = parseInt(set.s2);
                                            const s1Win = !isNaN(s1) && !isNaN(s2) && s1 > s2;
                                            const s2Win = !isNaN(s1) && !isNaN(s2) && s2 > s1;
                                            return (
                                                <div key={sIdx} className="flex flex-col gap-1 items-center">
                                                    <input type="number" value={set.s1} placeholder="-" onChange={(e) => handleSetScoreChange(idx, sIdx, 's1', e.target.value)} className={`w-10 h-9 text-center border rounded text-lg font-mono p-0 focus:border-blue-500 outline-none transition-colors no-spin ${s1Win ? 'bg-orange-100 border-orange-400 text-red-700 font-bold' : 'bg-white border-gray-300 text-gray-600'}`} />
                                                    <div className="h-px w-full bg-gray-200"></div>
                                                    <input type="number" value={set.s2} placeholder="-" onChange={(e) => handleSetScoreChange(idx, sIdx, 's2', e.target.value)} className={`w-10 h-9 text-center border rounded text-lg font-mono p-0 focus:border-blue-500 outline-none transition-colors no-spin ${s2Win ? 'bg-orange-100 border-orange-400 text-red-700 font-bold' : 'bg-white border-gray-300 text-gray-600'}`} />
                                                </div>
                                            );
                                        })}
                                    </div>

                                    <div className="flex flex-col items-center justify-center bg-white border border-gray-200 rounded px-3 py-1 shadow-inner">
                                        <span className={`text-xl font-bold font-mono ${pointWinner === 0 ? 'text-red-600' : 'text-gray-400'}`}>{sets1}</span>
                                        <div className="h-px w-4 bg-gray-200 my-0.5"></div>
                                        <span className={`text-xl font-bold font-mono ${pointWinner === 1 ? 'text-red-600' : 'text-gray-400'}`}>{sets2}</span>
                                    </div>

                                    <div className="flex flex-col gap-1 items-end">
                                        <input type="text" placeholder="選手 A" value={sub.p2SubName} onChange={(e) => handleSubChange(idx, 'p2SubName', e.target.value)} className={`w-2/3 p-1.5 rounded border text-right text-sm focus:ring-1 focus:ring-blue-400 outline-none ${getP2Style()}`} />
                                        {sub.type === 'double' && (
                                            <input type="text" placeholder="選手 B" value={sub.p2PartnerName} onChange={(e) => handleSubChange(idx, 'p2PartnerName', e.target.value)} className={`w-2/3 p-1.5 rounded border text-right text-sm focus:ring-1 focus:ring-blue-400 outline-none ${getP2Style()}`} />
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-3 shrink-0">
                    <button onClick={onClose} className="px-5 py-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors">取消</button>
                    <button onClick={handleConfirm} className="px-5 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg shadow-md transition-colors flex items-center gap-2"><Check size={18} /> 儲存戰況</button>
                </div>
            </div>
        </div>
    );
};

// --- 淘汰賽 Match Component ---
const MatchCard = ({ match, roundIndex, rIndex, onNameChange, onScoreChange, winCondition, onEditClick, elimType }) => {
    // 判斷是否為雙打模式，以此調整高度與樣式
    const isDouble = elimType === 'double';
    // 在雙打模式下使用小型的 ScoreControl，其他模式正常
    const scoreVariant = isDouble ? 'small' : 'normal';
    // 雙打模式下高度設為 h-20 (80px), 其他模式維持 h-14 (56px)
    const rowHeightClass = isDouble ? 'h-20' : 'h-14';

    return (
        <div className={`bg-white border-2 border-gray-100 rounded-xl shadow-sm overflow-hidden flex flex-col w-64 z-10 relative group`}>
            
            <button 
                onClick={() => onEditClick(match)}
                className="absolute top-1/2 left-1 -translate-y-1/2 bg-white border border-gray-200 p-1.5 rounded-full shadow-sm text-gray-400 hover:text-blue-600 hover:border-blue-300 z-30 transition-all hover:scale-105"
                title="詳細戰況"
            >
                <Edit3 size={12} />
            </button>

            {/* Player 1 Row */}
            <div className={`flex items-center justify-between pl-7 border-b border-gray-100 transition-colors ${rowHeightClass} ${isDouble ? 'py-1.5' : 'p-2'} ${match.winner === 0 ? 'bg-orange-100 border-l-4 border-orange-400' : 'border-l-4 border-transparent'}`}>
                {/* Number + Inputs Container */}
                <div className="flex items-center flex-1 min-w-0 mr-1">
                    {/* Number: Vertically centered relative to inputs */}
                    <div className="w-6 text-center text-xs font-bold text-gray-400 flex-shrink-0">
                        {rIndex === 0 ? (match.matchIndex * 2 + 1) : ''}
                    </div>

                    {/* Inputs Stack */}
                    <div className="flex flex-col w-full gap-1">
                        <input 
                            type="text" 
                            value={match.p1 || ''} 
                            onChange={(e) => rIndex === 0 && onNameChange(rIndex, match.matchIndex, 'p1', e.target.value)} 
                            disabled={rIndex !== 0} 
                            // 調整：雙打模式顯示 "選手 1A", 單打/團體維持原樣
                            // 修正：僅第一輪顯示 placeholder
                            placeholder={rIndex === 0 ? (isDouble ? `選手 ${match.matchIndex * 2 + 1}A` : (elimType === 'team' ? "隊伍 A" : "選手 1")) : ""} 
                            className={`w-full bg-transparent border-none focus:ring-0 truncate ${isDouble ? 'text-sm py-1.5 ml-[2px]' : 'text-base'} ${match.winner === 0 ? 'font-bold text-orange-900' : 'text-gray-800'}`} 
                        />
                        {isDouble && (
                            <input 
                                type="text" 
                                value={match.p1Partner || ''} 
                                onChange={(e) => rIndex === 0 && onNameChange(rIndex, match.matchIndex, 'p1Partner', e.target.value)} 
                                disabled={rIndex !== 0} 
                                // 調整：雙打模式顯示 "選手 1B"
                                placeholder={rIndex === 0 ? `選手 ${match.matchIndex * 2 + 1}B` : ""} 
                                className={`w-full bg-transparent border-none focus:ring-0 truncate text-sm py-1.5 ml-[2px] ${match.winner === 0 ? 'text-orange-800' : 'text-gray-500'}`} 
                            />
                        )}
                    </div>
                </div>

                {/* Score - 修正：使用 showButtons={true} (但組件內會判斷是否為輸入模式，因為這裡不需要直接輸入，還是保留按鈕？ wait, user said "比分框的上下箭頭取消 但+-符號要保留") */}
                {/* 其實 ScoreControl 預設 showButtons=true. 只要確保 CSS no-spin 生效即可 */}
                <div className="flex-shrink-0 -ml-[1px]">
                    <ScoreControl 
                        score={match.s1} 
                        onChange={(val) => onScoreChange(rIndex, match.matchIndex, 's1', val)} 
                        colorClass={match.winner === 0 ? 'text-orange-900 font-bold' : 'text-gray-800'} 
                        maxScore={winCondition} 
                        variant={scoreVariant}
                        showButtons={true} 
                    />
                </div>
            </div>

            {/* Player 2 Row */}
            <div className={`flex items-center justify-between pl-7 transition-colors ${rowHeightClass} ${isDouble ? 'py-1.5' : 'p-2'} ${match.winner === 1 ? 'bg-orange-100 border-l-4 border-orange-400' : 'border-l-4 border-transparent'}`}>
                <div className="flex items-center flex-1 min-w-0 mr-1">
                    <div className="w-6 text-center text-xs font-bold text-gray-400 flex-shrink-0">
                        {rIndex === 0 ? (match.matchIndex * 2 + 2) : ''}
                    </div>
                    
                    <div className="flex flex-col w-full gap-1">
                        <input 
                            type="text" 
                            value={match.p2 || ''} 
                            onChange={(e) => rIndex === 0 && onNameChange(rIndex, match.matchIndex, 'p2', e.target.value)} 
                            disabled={rIndex !== 0} 
                            // 調整：雙打模式顯示 "選手 2A", 單打/團體維持原樣
                            placeholder={rIndex === 0 ? (isDouble ? `選手 ${match.matchIndex * 2 + 2}A` : (elimType === 'team' ? "隊伍 B" : "選手 2")) : ""} 
                            className={`w-full bg-transparent border-none focus:ring-0 truncate ${isDouble ? 'text-sm py-1.5 ml-[2px]' : 'text-base'} ${match.winner === 1 ? 'font-bold text-orange-900' : 'text-gray-800'}`} 
                        />
                        {isDouble && (
                            <input 
                                type="text" 
                                value={match.p2Partner || ''} 
                                onChange={(e) => rIndex === 0 && onNameChange(rIndex, match.matchIndex, 'p2Partner', e.target.value)} 
                                disabled={rIndex !== 0} 
                                // 調整：雙打模式顯示 "選手 2B"
                                placeholder={rIndex === 0 ? `選手 ${match.matchIndex * 2 + 2}B` : ""} 
                                className={`w-full bg-transparent border-none focus:ring-0 truncate text-sm py-1.5 ml-[2px] ${match.winner === 1 ? 'text-orange-800' : 'text-gray-500'}`} 
                            />
                        )}
                    </div>
                </div>

                <div className="flex-shrink-0 -ml-[1px]">
                    <ScoreControl 
                        score={match.s2} 
                        onChange={(val) => onScoreChange(rIndex, match.matchIndex, 's2', val)} 
                        colorClass={match.winner === 1 ? 'text-orange-900 font-bold' : 'text-gray-800'} 
                        maxScore={winCondition} 
                        variant={scoreVariant}
                        showButtons={true}
                    />
                </div>
            </div>
        </div>
    );
};

// --- SVG 多邊形視覺化組件 ---
const RoundRobinPolygon = ({ group }) => {
  const numPlayers = group.players.length;
  const radius = 130; 
  const centerX = 150;
  const centerY = 150;

  const getCoordinates = (index, total) => {
    const angle = (index * 2 * Math.PI) / total - Math.PI / 2; 
    return { x: centerX + radius * Math.cos(angle), y: centerY + radius * Math.sin(angle) };
  };

  const playerCoords = group.players.map((_, i) => getCoordinates(i, numPlayers));

  return (
    <div className="flex justify-center items-center py-6 pointer-events-none">
      <svg width="480" height="480" viewBox="0 0 300 300" className="pointer-events-auto">
        {group.matches.map((match) => {
          const p1 = playerCoords[match.p1Index];
          const p2 = playerCoords[match.p2Index];
          const hasScore = match.s1 !== '' && match.s2 !== '';
          const dx = p2.x - p1.x;
          const dy = p2.y - p1.y;
          
          const isFive = numPlayers === 5;
          const t1 = isFive ? 0.25 : 0.32;
          const t2 = isFive ? 0.75 : 0.68;

          const s1Pos = { x: p1.x + dx * t1, y: p1.y + dy * t1 };
          const s2Pos = { x: p1.x + dx * t2, y: p1.y + dy * t2 };

          return (
            <g key={match.id}>
              <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke={hasScore ? "#3b82f6" : "#e5e7eb"} strokeWidth={hasScore ? 2.5 : 1.2} />
              {hasScore && (
                <>
                  <g transform={`translate(${s1Pos.x}, ${s1Pos.y})`}>
                    <circle r="12" fill="white" stroke="#3b82f6" strokeWidth="1.5" className="drop-shadow-sm"/>
                    <text textAnchor="middle" dominantBaseline="middle" className="font-bold fill-blue-700 pointer-events-none" style={{ fontSize: '11px', fontWeight: '800' }} dy="1">{match.s1}</text>
                  </g>
                  <g transform={`translate(${s2Pos.x}, ${s2Pos.y})`}>
                    <circle r="12" fill="white" stroke="#3b82f6" strokeWidth="1.5" className="drop-shadow-sm"/>
                    <text textAnchor="middle" dominantBaseline="middle" className="font-bold fill-blue-700 pointer-events-none" style={{ fontSize: '11px', fontWeight: '800' }} dy="1">{match.s2}</text>
                  </g>
                </>
              )}
            </g>
          );
        })}
        {playerCoords.map((coord, i) => {
          const playerName = group.players[i].name;
          const rectWidth = Math.max(60, playerName.length * 9 + 16); 
          const rectHeight = 24;
          return (
            <g key={i}>
              <rect x={coord.x - rectWidth / 2} y={coord.y - rectHeight / 2} width={rectWidth} height={rectHeight} rx="4" fill="white" stroke="#64748b" strokeWidth="1.5" className="drop-shadow-md"/>
              <text x={coord.x} y={coord.y} dy="1" textAnchor="middle" dominantBaseline="middle" className="text-xs font-bold fill-gray-800 pointer-events-none" style={{ fontSize: '11px' }}>{playerName}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

// --- 初始數據生成器 (修正: 預設值為空字串，僅透過 Placeholder 提示) ---
const generateInitialBracket = (numParticipants) => {
  const rounds = [];
  let currentRoundSize = numParticipants / 2;
  const totalRounds = Math.log2(numParticipants);

  for (let r = 0; r < totalRounds; r++) {
    const matches = [];
    for (let m = 0; m < currentRoundSize; m++) {
      matches.push({
        id: `r${r}-m${m}`,
        roundIndex: r,
        matchIndex: m,
        p1: '', // 預設為空，依靠 Placeholder
        p1Partner: '', 
        p2: '', 
        p2Partner: '', 
        s1: '', s2: '', winner: null,
        subMatches: []
      });
    }
    rounds.push(matches);
    currentRoundSize /= 2;
  }
  rounds.push([{ id: `champion`, isChampion: true, winnerName: "待定冠軍", winnerPartner: "" }]); // Add winnerPartner for champion
  return rounds;
};

const createSingleGroup = (name, numPlayers, pointsCount = 5) => {
    const id = Date.now() + Math.random();
    const players = Array.from({ length: numPlayers }, (_, i) => ({ id: `p-${id}-${i}`, name: `隊伍 ${i + 1}` }));
    const matches = [];
    for (let i = 0; i < numPlayers; i++) {
      for (let j = i + 1; j < numPlayers; j++) {
        matches.push({ 
            id: `m-${id}-${i}-${j}`, 
            p1Index: i, 
            p2Index: j, 
            s1: '', 
            s2: '', 
            winner: null,
            subMatches: [] 
        });
      }
    }
    return { id, name, players, matches, pointsCount };
};

// 計算循環賽積分
const calculateGroupStandings = (group) => {
  const standings = group.players.map(p => ({ ...p, played: 0, won: 0, lost: 0, draw: 0, netSets: 0, setRatio: 0 }));
  group.matches.forEach(m => {
    const s1 = m.s1 === '' ? -1 : parseInt(m.s1); 
    const s2 = m.s2 === '' ? -1 : parseInt(m.s2);
    if (s1 !== -1 && s2 !== -1) {
      const p1 = standings[m.p1Index];
      const p2 = standings[m.p2Index];
      p1.played++; p2.played++;
      
      p1.netSets += (s1 - s2);
      p2.netSets += (s2 - s1);

      p1.totalWonPoints = (p1.totalWonPoints || 0) + s1;
      p1.totalLostPoints = (p1.totalLostPoints || 0) + s2;
      p2.totalWonPoints = (p2.totalWonPoints || 0) + s2;
      p2.totalLostPoints = (p2.totalLostPoints || 0) + s1;

      if (s1 > s2) { p1.won++; p2.lost++; }
      else if (s2 > s1) { p2.won++; p1.lost++; }
      else { p1.draw++; p2.draw++; }
    }
  });

  standings.forEach(p => {
      if (p.totalLostPoints && p.totalLostPoints > 0) {
          p.setRatio = (p.totalWonPoints / p.totalLostPoints).toFixed(2);
      } else if (p.totalWonPoints > 0) {
          p.setRatio = "MAX";
      } else {
          p.setRatio = "-";
      }
  });

  return standings.sort((a, b) => {
    if (b.won !== a.won) return b.won - a.won;
    if (b.netSets !== a.netSets) return b.netSets - a.netSets;
    if (b.setRatio !== a.setRatio) {
        if(b.setRatio === "MAX") return 1;
        if(a.setRatio === "MAX") return -1;
        const ratioA = parseFloat(a.setRatio === "-" ? 0 : a.setRatio);
        const ratioB = parseFloat(b.setRatio === "-" ? 0 : b.setRatio);
        return ratioB - ratioA;
    }
    return 0;
  });
};

const TournamentManager = () => {
  const [title, setTitle] = useState("賽事管理系統");
  const [mode, setMode] = useState('elimination');
  const [elimType, setElimType] = useState('single');
  const [isClient, setIsClient] = useState(false);
  const [elimSize, setElimSize] = useState(8);
  const [bracket, setBracket] = useState([]);
  const [rrGroups, setRrGroups] = useState([]);
  const [activeGroupId, setActiveGroupId] = useState(null);
  const [newGroupSize, setNewGroupSize] = useState(3);
  const [confirmState, setConfirmState] = useState({ isOpen: false, message: '', onConfirm: null });
  const [toast, setToast] = useState(null);
  
  const [winCondition, setWinCondition] = useState(2); 
  const [matchModalData, setMatchModalData] = useState(null);
  const [elimPointsCount, setElimPointsCount] = useState(3); 

  const contentRef = useRef(null);

  useEffect(() => {
    setBracket(generateInitialBracket(elimSize));
    setRrGroups([createSingleGroup("Group A", 3)]);
    setIsClient(true);
  }, []);

  useEffect(() => {
    setBracket(generateInitialBracket(elimSize));
  }, [elimSize, elimType]); // Reset bracket when elimType changes

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleSave = () => {
    const data = {
      title, mode, elimSize, bracket, rrGroups, winCondition, elimPointsCount, elimType,
      timestamp: new Date().toLocaleString()
    };
    localStorage.setItem('tournament_backup', JSON.stringify(data));
    showToast("✅ 進度已暫存到本機！");
  };

  const handleLoad = () => {
    const saved = localStorage.getItem('tournament_backup');
    if (saved) {
      if(window.confirm("確定要讀取之前的暫存檔嗎？當前的進度將會被覆蓋。")) {
        const data = JSON.parse(saved);
        if (data.title) setTitle(data.title);
        setMode(data.mode);
        setElimSize(data.elimSize);
        setBracket(data.bracket);
        setRrGroups(data.rrGroups || []);
        if (data.winCondition !== undefined) setWinCondition(data.winCondition);
        if (data.elimPointsCount !== undefined) setElimPointsCount(data.elimPointsCount);
        if (data.elimType !== undefined) setElimType(data.elimType);
        showToast(`📂 已讀取存檔 (${data.timestamp})`);
      }
    } else {
      alert("找不到暫存檔案。");
    }
  };

  const handleExportPDF = () => {
    window.print();
  };

  const handleNameChange = (roundIndex, matchIndex, field, newName) => {
    const newBracket = [...bracket];
    newBracket[roundIndex][matchIndex][field] = newName;
    propagateUpdates(newBracket, roundIndex, matchIndex);
    setBracket(newBracket);
  };

  const handleElimScoreChange = (roundIndex, matchIndex, scoreKey, newScore) => {
    const newBracket = [...bracket];
    const match = newBracket[roundIndex][matchIndex];
    match[scoreKey] = newScore;
    const s1 = match.s1 === '' ? -1 : parseInt(match.s1);
    const s2 = match.s2 === '' ? -1 : parseInt(match.s2);
    let winnerName = null;
    let winnerIndex = null;
    let winnerPartner = null;

    if (s1 !== -1 && s2 !== -1) {
      if (s1 > s2) { 
          winnerName = match.p1; 
          winnerIndex = 0; 
          winnerPartner = match.p1Partner;
      }
      else if (s2 > s1) { 
          winnerName = match.p2; 
          winnerIndex = 1; 
          winnerPartner = match.p2Partner;
      }
    }
    match.winner = winnerIndex;

    const nextRoundIndex = roundIndex + 1;
    if (nextRoundIndex < newBracket.length) {
      if (newBracket[nextRoundIndex][0].isChampion) {
         newBracket[nextRoundIndex][0].winnerName = winnerName || "待定冠軍";
         // Update champion partner too if double
         if (elimType === 'double') {
             newBracket[nextRoundIndex][0].winnerPartner = winnerPartner;
         }
      } else {
        const nextMatchIndex = Math.floor(matchIndex / 2);
        const playerSlot = matchIndex % 2 === 0 ? 'p1' : 'p2';
        newBracket[nextRoundIndex][nextMatchIndex][playerSlot] = winnerName;
        if(elimType === 'double') {
            const partnerSlot = matchIndex % 2 === 0 ? 'p1Partner' : 'p2Partner';
            newBracket[nextRoundIndex][nextMatchIndex][partnerSlot] = winnerPartner;
        }
        propagateUpdates(newBracket, nextRoundIndex, nextMatchIndex);
      }
    }
    setBracket(newBracket);
  };

  const handleElimDetailSave = (matchId, subMatches, totalS1, totalS2) => {
      const newBracket = [...bracket];
      for(let r = 0; r < newBracket.length - 1; r++) { 
          const matchIndex = newBracket[r].findIndex(m => m.id === matchId);
          if (matchIndex !== -1) {
              const match = newBracket[r][matchIndex];
              match.subMatches = subMatches;
              match.s1 = totalS1;
              match.s2 = totalS2;
              
              let winnerName = null;
              let winnerIndex = null;
              let winnerPartner = null;

              if (totalS1 > totalS2) { 
                  winnerName = match.p1; 
                  winnerIndex = 0; 
                  winnerPartner = match.p1Partner;
              }
              else if (totalS2 > totalS1) { 
                  winnerName = match.p2; 
                  winnerIndex = 1; 
                  winnerPartner = match.p2Partner;
              }
              match.winner = winnerIndex;

              const nextRoundIndex = r + 1;
              if (nextRoundIndex < newBracket.length) {
                if (newBracket[nextRoundIndex][0].isChampion) {
                    newBracket[nextRoundIndex][0].winnerName = winnerName || "待定冠軍";
                    if (elimType === 'double') {
                        newBracket[nextRoundIndex][0].winnerPartner = winnerPartner;
                    }
                } else {
                    const nextMatchIndex = Math.floor(matchIndex / 2);
                    const playerSlot = matchIndex % 2 === 0 ? 'p1' : 'p2';
                    newBracket[nextRoundIndex][nextMatchIndex][playerSlot] = winnerName;
                    if(elimType === 'double') {
                        const partnerSlot = matchIndex % 2 === 0 ? 'p1Partner' : 'p2Partner';
                        newBracket[nextRoundIndex][nextMatchIndex][partnerSlot] = winnerPartner;
                    }
                    propagateUpdates(newBracket, nextRoundIndex, nextMatchIndex);
                }
              }
              break;
          }
      }
      setBracket(newBracket);
  };

  const propagateUpdates = (currentBracket, rIdx, mIdx) => {
    if (rIdx >= currentBracket.length - 1) return;
    if (currentBracket[rIdx][mIdx].isChampion) return;
    const match = currentBracket[rIdx][mIdx];
    const s1 = match.s1 === '' ? -1 : parseInt(match.s1);
    const s2 = match.s2 === '' ? -1 : parseInt(match.s2);
    let winnerName = null;
    let winnerPartner = null;

    if (s1 !== -1 && s2 !== -1) {
      if (s1 > s2) { winnerName = match.p1; winnerPartner = match.p1Partner; }
      else if (s2 > s1) { winnerName = match.p2; winnerPartner = match.p2Partner; }
    }
    const nextRoundIndex = rIdx + 1;
    if (currentBracket[nextRoundIndex][0].isChampion) {
       currentBracket[nextRoundIndex][0].winnerName = winnerName || "待定冠軍";
       if (elimType === 'double') {
            currentBracket[nextRoundIndex][0].winnerPartner = winnerPartner;
       }
    } else {
      const nextMatchIndex = Math.floor(mIdx / 2);
      const playerSlot = mIdx % 2 === 0 ? 'p1' : 'p2';
      const partnerSlot = mIdx % 2 === 0 ? 'p1Partner' : 'p2Partner';
      const nextMatch = currentBracket[nextRoundIndex][nextMatchIndex];
      
      const shouldUpdate = nextMatch[playerSlot] !== winnerName || (elimType === 'double' && nextMatch[partnerSlot] !== winnerPartner);
      
      if (shouldUpdate) {
        nextMatch[playerSlot] = winnerName;
        if(elimType === 'double') {
             nextMatch[partnerSlot] = winnerPartner;
        }
        propagateUpdates(currentBracket, nextRoundIndex, nextMatchIndex);
      }
    }
  };

  const handleAddGroup = () => {
      const nextLetter = String.fromCharCode(65 + rrGroups.length);
      const newGroup = createSingleGroup(`Group ${nextLetter}`, newGroupSize);
      setRrGroups([...rrGroups, newGroup]);
  };

  const handleDeleteGroup = (e, groupId) => {
      e.stopPropagation(); e.preventDefault(); 
      setConfirmState({
        isOpen: true, message: "確定要刪除此分組嗎？此操作無法復原。",
        onConfirm: () => {
          setRrGroups(rrGroups.filter(g => g.id !== groupId));
          setConfirmState({ isOpen: false, message: '', onConfirm: null });
        }
      });
  };

  const handleRrNameChange = (groupIndex, playerIndex, newName) => {
    const newGroups = [...rrGroups];
    newGroups[groupIndex].players[playerIndex].name = newName;
    setRrGroups(newGroups);
  };

  const handleRrScoreChange = (groupIndex, matchId, scoreKey, newScore) => {
    const newGroups = [...rrGroups];
    const group = newGroups[groupIndex];
    const match = group.matches.find(m => m.id === matchId);
    if (match) {
      match[scoreKey] = newScore;
      const s1 = match.s1 === '' ? -1 : parseInt(match.s1);
      const s2 = match.s2 === '' ? -1 : parseInt(match.s2);
      if (s1 !== -1 && s2 !== -1) {
        if (s1 > s2) match.winner = 0; else if (s2 > s1) match.winner = 1; else match.winner = -1;
      } else { match.winner = null; }
      setRrGroups(newGroups);
    }
  };

  const handleDetailSave = (matchId, subMatches, totalS1, totalS2) => {
      if (mode === 'elimination') {
          handleElimDetailSave(matchId, subMatches, totalS1, totalS2);
      } else {
          if (activeGroupId === null) return;
          const newGroups = [...rrGroups];
          const group = newGroups[activeGroupId];
          const match = group.matches.find(m => m.id === matchId);
          if (match) {
              match.subMatches = subMatches;
              match.s1 = totalS1;
              match.s2 = totalS2;
              if (totalS1 > totalS2) match.winner = 0;
              else if (totalS2 > totalS1) match.winner = 1;
              else match.winner = -1;
          }
          setRrGroups(newGroups);
      }
  };

  const handleGroupPointsChange = (groupIndex, newPoints) => {
      const newGroups = [...rrGroups];
      newGroups[groupIndex].pointsCount = newPoints;
      setRrGroups(newGroups);
  };

  const resetTournament = () => {
    setConfirmState({
        isOpen: true, message: "確定要重置所有賽程嗎？所有目前的比分將會遺失。",
        onConfirm: () => {
          if (mode === 'elimination') setBracket(generateInitialBracket(elimSize));
          else setRrGroups([createSingleGroup("Group A", 3)]);
          setConfirmState({ isOpen: false, message: '', onConfirm: null });
        }
    });
  };

  const closeConfirm = () => { setConfirmState({ isOpen: false, message: '', onConfirm: null }); };
  const BASE_MATCH_HEIGHT = elimType === 'double' ? 160 : 140; 

  if (!isClient) return null;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-sans pb-20">
      
      <ConfirmDialog isOpen={confirmState.isOpen} message={confirmState.message} onConfirm={confirmState.onConfirm} onCancel={closeConfirm} />
      
      {/* 全域 Style: 隱藏所有 input[type=number] 的原生箭頭 */}
      <style>{`
        .no-spin::-webkit-outer-spin-button,
        .no-spin::-webkit-inner-spin-button {
            -webkit-appearance: none;
            margin: 0;
        }
        .no-spin {
            -moz-appearance: textfield;
        }
      `}</style>
      
      {matchModalData && (
          <TeamMatchModal 
            isOpen={true}
            onClose={() => setMatchModalData(null)}
            matchData={matchModalData.match}
            p1Name={matchModalData.p1Name}
            p2Name={matchModalData.p2Name}
            p1PartnerName={matchModalData.p1PartnerName}
            p2PartnerName={matchModalData.p2PartnerName}
            pointsCount={mode === 'elimination' ? (elimType === 'team' ? elimPointsCount : 1) : rrGroups[activeGroupId].pointsCount} 
            defaultType={elimType === 'double' ? 'double' : 'single'}
            winCondition={winCondition}
            onSave={handleDetailSave}
          />
      )}

      {toast && <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white px-6 py-3 rounded-full shadow-lg z-[200] animate-in fade-in slide-in-from-bottom-4 print:hidden">{toast}</div>}

      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-20 print:hidden">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex items-center gap-2 w-full md:w-auto justify-between md:justify-start">
            <div className="flex items-center gap-2"><div className="bg-blue-600 p-2 rounded-lg text-white"><Trophy size={20} /></div>
              {/* 可編輯標題 */}
              <input 
                type="text" 
                value={title} 
                onChange={(e) => setTitle(e.target.value)} 
                className="text-lg font-bold text-gray-900 bg-transparent border-none focus:ring-0 w-48 sm:w-auto"
                placeholder="輸入賽事名稱..."
              />
              <PenLine size={14} className="text-gray-400" />
            </div>
            
            <div className="flex bg-gray-100 p-1 rounded-lg ml-4">
              <button onClick={() => { setMode('elimination'); setActiveGroupId(null); }} className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${mode === 'elimination' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}><GitMerge size={16} /> <span className="hidden sm:inline">單淘汰</span></button>
              <button onClick={() => setMode('roundRobin')} className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${mode === 'roundRobin' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}><Grid size={16} /> <span className="hidden sm:inline">循環賽</span></button>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto justify-end overflow-x-auto">
            {mode === 'elimination' && (
                <div className="flex items-center gap-2 bg-purple-50 px-2 py-1 rounded-lg border border-purple-100 mr-2">
                    <span className="text-sm font-bold text-purple-800 hidden sm:inline">模式</span>
                    <select value={elimType} onChange={(e) => setElimType(e.target.value)} className="bg-transparent border-none text-sm font-bold text-purple-900 rounded focus:ring-0 cursor-pointer">
                        <option value="single">單打</option><option value="double">雙打</option><option value="team">團體</option>
                    </select>
                </div>
            )}
            <div className="flex items-center gap-2 bg-gray-50 px-2 py-1 rounded-lg border border-gray-200 mr-2">
                <Settings size={16} className="text-gray-500" />
                <select value={winCondition} onChange={(e) => setWinCondition(parseInt(e.target.value))} className="bg-transparent border-none text-sm font-bold text-gray-700 focus:ring-0 cursor-pointer" title="設定比賽獲勝條件">
                    <option value={0}>一局決勝</option><option value={2}>三戰兩勝</option><option value={3}>五戰三勝</option><option value={4}>七戰四勝</option>
                </select>
            </div>
            {mode === 'elimination' && elimType === 'team' && (
                <div className="flex items-center gap-2 bg-blue-50 px-2 py-1 rounded-lg border border-blue-100 mr-2">
                    <span className="text-sm font-bold text-blue-800 hidden sm:inline">點數</span>
                    <select value={elimPointsCount} onChange={(e) => setElimPointsCount(parseInt(e.target.value))} className="bg-transparent border-none text-sm font-bold text-blue-900 rounded focus:ring-0 cursor-pointer">
                        <option value={3}>3 點</option><option value={5}>5 點</option><option value={7}>7 點</option>
                    </select>
                </div>
            )}
            <div className="flex items-center gap-1 border-r border-gray-200 pr-2 mr-2">
                <button onClick={handleSave} className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors" title="暫存進度"><Save size={18} /></button>
                <button onClick={handleLoad} className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors" title="讀取暫存"><FileDown size={18} /></button>
                <button onClick={handleExportPDF} className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors" title="匯出 PDF"><Download size={18} /></button>
            </div>
            {mode === 'elimination' ? (
              <select value={elimSize} onChange={(e) => setElimSize(parseInt(e.target.value))} className="bg-gray-100 border-none text-sm font-bold text-gray-900 rounded px-2 py-1.5 cursor-pointer">
                <option value={4}>4人</option><option value={8}>8人</option><option value={16}>16人</option><option value={32}>32人</option><option value={64}>64人</option><option value={128}>128人</option>
              </select>
            ) : (
              activeGroupId === null && (
                <div className="flex items-center gap-1 bg-gray-50 p-1 rounded-lg border border-gray-200">
                    <span className="text-sm font-medium pl-2 text-gray-500 hidden sm:inline">新增</span>
                    <select value={newGroupSize} onChange={(e) => setNewGroupSize(parseInt(e.target.value))} className="bg-white border border-gray-200 text-sm font-bold text-gray-900 rounded px-2 py-1 cursor-pointer">
                        <option value={3}>3 人</option><option value={4}>4 人</option><option value={5}>5 人</option>
                    </select>
                    <button onClick={handleAddGroup} className="p-1 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors"><PlusCircle size={16} /></button>
                </div>
              )
            )}
            <button onClick={resetTournament} className="p-2 text-red-600 bg-red-50 rounded-md hover:bg-red-100" title="重置"><RefreshCw size={18} /></button>
          </div>
        </div>
      </header>

      <main ref={contentRef} className="p-4 overflow-x-auto min-h-[500px] bg-gray-50">
        {mode === 'elimination' && (
          <div 
            className="flex gap-16 min-w-max mx-auto px-4 pb-12 pt-8 justify-start items-stretch"
            style={{ minHeight: `${BASE_MATCH_HEIGHT * (elimSize/2)}px` }} 
          >
            {bracket.map((round, rIndex) => {
              const isChampionRound = rIndex === bracket.length - 1;
              const matches = round;
              
              if (isChampionRound) {
                  return (
                    <div key="champ" className="flex flex-col justify-center items-center relative min-w-[280px]">
                        <div className="absolute -top-8 w-full text-center text-sm font-bold text-gray-500">最終冠軍</div>
                        <div className="bg-gradient-to-br from-yellow-50 to-white border-4 border-yellow-400 rounded-xl p-6 text-center shadow-xl w-72">
                            <Trophy size={48} className="mx-auto text-yellow-500 mb-2" />
                            <div className="text-xs text-yellow-600 font-bold uppercase mb-1">WINNER</div>
                            <div className="text-xl font-bold text-gray-900 break-words flex flex-col items-center">
                                <span>{matches[0].winnerName}</span>
                                {elimType === 'double' && matches[0].winnerPartner && (
                                    <span className="text-lg text-gray-600 mt-1">{matches[0].winnerPartner}</span>
                                )}
                            </div>
                        </div>
                    </div>
                  );
              }

              const currentMatchHeight = BASE_MATCH_HEIGHT * Math.pow(2, rIndex);

              return (
                <div key={rIndex} className="flex flex-col relative min-w-[320px]">
                  <div className="absolute -top-8 left-0 w-full text-center text-sm font-bold text-gray-500 bg-gray-100 rounded-full py-1">
                    {rIndex === bracket.length - 2 ? '總決賽' : rIndex === bracket.length - 3 ? '準決賽' : `第 ${rIndex + 1} 輪`}
                  </div>

                  <div className="flex flex-col flex-1 justify-around"> 
                    {matches.map((match, mIndex) => (
                        <div 
                            key={match.id} 
                            className="flex flex-col justify-center items-center relative"
                            style={{ height: `${currentMatchHeight}px` }} 
                        >
                            <MatchCard 
                                match={match} 
                                roundIndex={rIndex}
                                rIndex={rIndex} 
                                onNameChange={handleNameChange} 
                                onScoreChange={handleElimScoreChange} 
                                winCondition={winCondition} 
                                elimType={elimType}
                                onEditClick={(m) => setMatchModalData({ 
                                    match: m, 
                                    p1Name: m.p1 || "選手1", 
                                    p2Name: m.p2 || "選手2",
                                    p1PartnerName: m.p1Partner,
                                    p2PartnerName: m.p2Partner
                                })}
                            />

                            {/* 樹狀圖連接線 */}
                            {rIndex < bracket.length - 2 && (
                                <>
                                    {mIndex % 2 === 0 && (
                                        <div 
                                            className="absolute right-[-2.5rem] top-1/2 w-10 border-r-2 border-t-2 border-gray-300 rounded-tr-md pointer-events-none"
                                            style={{ height: `${currentMatchHeight / 2}px` }} 
                                        >
                                            <div className="absolute -bottom-[2px] -right-10 w-10 h-[2px] bg-gray-300"></div>
                                        </div>
                                    )}
                                    {mIndex % 2 !== 0 && (
                                        <div 
                                            className="absolute right-[-2.5rem] bottom-1/2 w-10 border-r-2 border-b-2 border-gray-300 rounded-br-md pointer-events-none"
                                            style={{ height: `${currentMatchHeight / 2}px` }}
                                        ></div>
                                    )}
                                </>
                            )}
                            
                            {/* 總決賽連接線 */}
                            {rIndex === bracket.length - 2 && (
                                <div className="absolute right-[-2rem] top-1/2 -translate-y-1/2 w-8 h-0 pointer-events-none">
                                    <div className="absolute top-0 right-0 w-full h-0.5 bg-gray-300"></div>
                                </div>
                            )}
                        </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {mode === 'roundRobin' && (
          <div className="max-w-7xl mx-auto">
            {activeGroupId === null && (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {rrGroups.map((group, gIndex) => {
                        return (
                            <div key={group.id} className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-lg hover:border-blue-300 transition-all group overflow-hidden relative">
                                <button onClick={(e) => handleDeleteGroup(e, group.id)} className="absolute top-3 right-3 p-1.5 text-gray-400 bg-white hover:text-red-500 hover:bg-red-50 rounded-full shadow-sm border border-gray-100 transition-colors z-50 cursor-pointer print:hidden" title="刪除分組"><Trash2 size={16} /></button>
                                <div onClick={() => setActiveGroupId(gIndex)} className="cursor-pointer h-full">
                                    <div className="bg-gray-50 p-3 border-b border-gray-100 pr-12"><h3 className="font-bold text-lg text-gray-800 truncate">{group.name} ({group.players.length}人循環)</h3></div>
                                    <div className="bg-white"><RoundRobinPolygon group={group} /></div>
                                </div>
                            </div>
                        );
                    })}
                    {rrGroups.length === 0 && <div className="col-span-full py-12 text-center text-gray-400 border-2 border-dashed border-gray-200 rounded-xl"><Grid size={48} className="mx-auto mb-2 opacity-50" /><p>目前沒有分組，請從上方新增分組。</p></div>}
                </div>
            )}

            {activeGroupId !== null && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6 print:hidden">
                        <div className="flex items-center gap-4">
                            <button onClick={() => setActiveGroupId(null)} className="flex items-center gap-2 px-4 py-2 bg-white text-gray-600 rounded-lg border border-gray-200 hover:bg-gray-50 font-medium transition-colors"><ArrowLeft size={18} />返回分組總覽</button>
                            <h2 className="text-2xl font-bold text-gray-900">{rrGroups[activeGroupId].name} 詳細賽況</h2>
                        </div>
                        <div className="flex items-center gap-2 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100">
                            <span className="text-sm font-bold text-blue-800">賽制:</span>
                            <select 
                                value={rrGroups[activeGroupId].pointsCount || 5} 
                                onChange={(e) => handleGroupPointsChange(activeGroupId, parseInt(e.target.value))}
                                className="bg-white border border-blue-200 text-sm font-bold text-blue-900 rounded px-2 py-1 cursor-pointer"
                            >
                                <option value={5}>5 點制</option>
                                <option value={7}>7 點制</option>
                            </select>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                        <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2"><Users size={20} className="text-blue-500" />參賽隊伍設定</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                            {rrGroups[activeGroupId].players.map((player, index) => (
                                <div key={player.id} className="flex items-center bg-gray-50 p-2 rounded-lg border border-gray-200"><span className="w-8 text-center font-mono font-bold text-gray-400">{index + 1}</span><input type="text" value={player.name} onChange={(e) => handleRrNameChange(activeGroupId, index, e.target.value)} className="bg-transparent border-none focus:ring-0 w-full text-gray-800 font-medium" placeholder={`選手 ${index + 1}`} /></div>
                            ))}
                        </div>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 order-2 lg:order-1">
                            <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2"><Trophy size={20} className="text-yellow-500" />即時積分榜</h2>
                            <div className="overflow-x-auto"><table className="w-full text-sm text-left"><thead className="text-xs text-gray-500 uppercase bg-gray-50"><tr><th className="px-3 py-3">排名</th><th className="px-3 py-3">隊伍</th><th className="px-3 py-3 text-center">賽</th><th className="px-3 py-3 text-center">勝</th><th className="px-3 py-3 text-center">負</th><th className="px-3 py-3 text-center">淨局數</th><th className="px-3 py-3 text-center font-bold text-blue-600">得失局比</th></tr></thead><tbody>
                                {calculateGroupStandings(rrGroups[activeGroupId]).map((p, idx) => (
                                    <tr key={p.id} className="border-b hover:bg-gray-50"><td className="px-3 py-3 font-bold text-gray-400">{idx === 0 ? <Trophy size={16} className="text-yellow-400 inline" /> : idx + 1}</td><td className="px-3 py-3 font-medium text-gray-900">{p.name}</td><td className="px-3 py-3 text-center">{p.played}</td><td className="px-3 py-3 text-center text-green-600 font-bold">{p.won}</td><td className="px-3 py-3 text-center text-red-400">{p.lost}</td><td className="px-3 py-3 text-center text-gray-500">{p.netSets > 0 ? `+${p.netSets}` : p.netSets}</td><td className="px-3 py-3 text-center font-bold text-blue-600 text-lg">{p.setRatio}</td></tr>
                                ))}</tbody></table></div>
                        </div>
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 order-1 lg:order-2">
                            <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2"><Grid size={20} className="text-purple-500" />對戰賽程</h2>
                            <div className="space-y-3">
                                {rrGroups[activeGroupId].matches.map((match) => (
                                    <div key={match.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:border-blue-200 transition-colors bg-white">
                                        <button 
                                            onClick={() => setMatchModalData({ match, p1Name: rrGroups[activeGroupId].players[match.p1Index].name, p2Name: rrGroups[activeGroupId].players[match.p2Index].name })}
                                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors mr-2"
                                            title="編輯詳細戰況"
                                        >
                                            <Edit3 size={18} />
                                        </button>
                                        <div className={`flex-1 text-right pr-4 font-medium ${match.winner === 0 ? 'text-green-600 font-bold' : 'text-gray-700'}`}>{rrGroups[activeGroupId].players[match.p1Index].name}</div>
                                        <div className="flex items-center gap-2">
                                            <ScoreControl score={match.s1} onChange={(val) => handleRrScoreChange(activeGroupId, match.id, 's1', val)} colorClass={match.winner === 0 ? 'text-green-600' : ''} />
                                            <span className="text-gray-300 font-bold">:</span>
                                            <ScoreControl score={match.s2} onChange={(val) => handleRrScoreChange(activeGroupId, match.id, 's2', val)} colorClass={match.winner === 1 ? 'text-green-600' : ''} />
                                        </div>
                                        <div className={`flex-1 text-left pl-4 font-medium ${match.winner === 1 ? 'text-green-600 font-bold' : 'text-gray-700'}`}>{rrGroups[activeGroupId].players[match.p2Index].name}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default TournamentManager;