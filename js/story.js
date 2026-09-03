// Horror-The-Game: Part 1 - Story System

class StoryManager {
    constructor(game) {
        this.game = game;
        this.currentChapter = 1;
        this.storyFlags = {};
        this.dialogueQueue = [];
        this.isShowingDialogue = false;
    }
    
    // Story chapters and events
    getStoryData() {
        return {
            chapter1: {
                title: 'Das Erwachen',
                startDialogue: [
                    { speaker: '', text: '...wacht auf...' },
                    { speaker: '', text: 'Deine Augen öffnen sich langsam. Dunkelheit.' },
                    { speaker: '', text: 'Wo bin ich? Was ist passiert?' },
                    { speaker: 'System', text: 'OBJECTIVE: Finde einen Weg aus diesem Raum.' }
                ],
                events: [
                    {
                        trigger: 'enter_room_b',
                        dialogue: [
                            { speaker: '', text: 'Ein langer Korridor. Die Luft ist kalt.' },
                            { speaker: '', text: 'Da ist ein Summen... irgendwo in der Ferne.' }
                        ]
                    },
                    {
                        trigger: 'find_keycard',
                        dialogue: [
                            { speaker: '', text: 'Eine Keycard! Vielleicht kann ich damit Türen öffnen.' }
                        ]
                    },
                    {
                        trigger: 'first_enemy_sighting',
                        dialogue: [
                            { speaker: '', text: 'Was war das?! Eine Schatten...' },
                            { speaker: 'System', text: 'WARNING: Bleib im Schatten. Vermeide Sichtkontakt.' }
                        ]
                    },
                    {
                        trigger: 'enter_main_lab',
                        dialogue: [
                            { speaker: '', text: 'Das Hauptlabor. Hier muss es passiert sein.' },
                            { speaker: '', text: 'Blut. Überall Blut. Und diese... Kreaturen.' }
                        ]
                    },
                    {
                        trigger: 'find_log_1',
                        dialogue: [
                            { speaker: 'Log Entry #1', text: 'Tag 47: Das Experiment zeigt vielversprechende Ergebnisse. Die Subjekte reagieren positiv auf die Behandlung.' }
                        ]
                    },
                    {
                        trigger: 'find_log_2',
                        dialogue: [
                            { speaker: 'Log Entry #2', text: 'Tag 89: Etwas ist falsch. Subjekt 7 zeigt aggressive Tendenzen. Die anderen infizieren sich.' }
                        ]
                    },
                    {
                        trigger: 'find_log_3',
                        dialogue: [
                            { speaker: 'Log Entry #3', text: 'Tag 103: ES IST ENTKOMMEN. Wir sind alle infiziert. Gott vergebe uns.' }
                        ]
                    },
                    {
                        trigger: 'reach_exit',
                        dialogue: [
                            { speaker: '', text: 'Der Ausgang! Endlich!' },
                            { speaker: '', text: 'Aber... dieses Geräusch hinter mir...' }
                        ]
                    }
                ]
            }
        };
    }
    
    startChapter(chapterNum) {
        this.currentChapter = chapterNum;
        const story = this.getStoryData();
        const chapter = story['chapter' + chapterNum];
        
        if (chapter && chapter.startDialogue) {
            this.showDialogueSequence(chapter.startDialogue);
        }
    }
    
    triggerEvent(triggerName) {
        if (this.storyFlags[triggerName]) return; // Already triggered
        
        this.storyFlags[triggerName] = true;
        
        const story = this.getStoryData();
        const chapter = story['chapter' + this.currentChapter];
        
        if (chapter && chapter.events) {
            const event = chapter.events.find(e => e.trigger === triggerName);
            if (event && event.dialogue) {
                this.showDialogueSequence(event.dialogue);
            }
        }
    }
    
    showDialogueSequence(dialogues) {
        this.dialogueQueue = [...dialogues];
        this.showNextDialogue();
    }
    
    showNextDialogue() {
        if (this.dialogueQueue.length === 0) {
            this.isShowingDialogue = false;
            document.getElementById('dialogue-box').style.display = 'none';
            return;
        }
        
        this.isShowingDialogue = true;
        const dialogue = this.dialogueQueue.shift();
        
        const dialogueBox = document.getElementById('dialogue-box');
        const dialogueText = document.getElementById('dialogue-text');
        const nextBtn = document.getElementById('btn-dialogue-next');
        
        dialogueBox.style.display = 'block';
        
        let html = '';
        if (dialogue.speaker) {
            html += `<strong style="color:#ffcc00;">${dialogue.speaker}</strong><br>`;
        }
        html += dialogue.text;
        
        dialogueText.innerHTML = html;
        nextBtn.style.display = 'block';
        
        // Remove old handler, add new one
        const newNextBtn = nextBtn.cloneNode(true);
        nextBtn.parentNode.replaceChild(newNextBtn, nextBtn);
        
        newNextBtn.addEventListener('click', () => {
            this.showNextDialogue();
        });
    }
    
    skipDialogue() {
        this.dialogueQueue = [];
        this.isShowingDialogue = false;
        document.getElementById('dialogue-box').style.display = 'none';
    }
    
    getGameState() {
        return {
            chapter: this.currentChapter,
            storyFlags: { ...this.storyFlags }
        };
    }
    
    loadGameState(state) {
        this.currentChapter = state.chapter || 1;
        this.storyFlags = { ...state.storyFlags } || {};
    }
}

// Global instance placeholder (created in game.js)
let storyManager;
