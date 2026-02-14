Vue.component('date-picker', {
    props: ['value'],
    template: `
        <input type="date" :value="value" @input="$emit('input', $event.target.value)" />
    `
});

Vue.component('card', {
    props: ['card', 'columnIndex', 'cardIndex'],
    data() {
        return {
            isEditing: false,
            editTitle: '',
            editDescription: ''
        };
    },
    computed:{
        isLocked() {
            return this.columnIndex === 3;
        }
    },
    methods: {
        startEdit() {
            if (this.isLocked) return;
            this.editTitle = this.card.title;
            this.editDescription = this.card.description;
            this.isEditing = true;
        },
        saveEdit() {
            if (this.editTitle.trim() && this.editDescription.trim()) {
                this.card.title = this.editTitle;
                this.card.description = this.editDescription;
                this.card.updatedAt = new Date().toLocaleString();
                this.$emit('card-updated');
            }
            this.isEditing = false;
        },
        cancelEdit() {
            this.isEditing = false;
        }
    },
    template: `
 <div class="card" :class="{ completed: card.completed, overdue: card.overdue, locked: isLocked }">
            <div v-if="isEditing">
                <input type="text" v-model="editTitle" class="edit-input" />
                <textarea v-model="editDescription" rows="3" class="edit-textarea"></textarea>
                <div class="edit-buttons">
                    <button @click="saveEdit">Сохранить</button>
                    <button @click="cancelEdit">Отмена</button>
                </div>
            </div>

            <div v-else>
                <h3>{{ card.title }}</h3>
                <p>{{ card.description }}</p>
            </div>

            <p><strong>Дэдлайн:</strong> {{ card.deadline }}</p>
            <date-picker 
                v-model="card.deadline" 
                @input="$emit('card-updated')" 
                :disabled="isLocked"
            ></date-picker>

            <p><strong>Создано:</strong> {{ card.createdAt }}</p>
            <p><strong>Обновлено:</strong> {{ card.updatedAt }}</p>

            <div class="card-buttons" v-if="!isEditing">
                <button v-if="!isLocked" @click="startEdit">Редактировать</button>
                
                <button v-if="columnIndex < 3" @click="$emit('move-card', columnIndex, columnIndex + 1, cardIndex)">
                    Следующая
                </button>
                <button v-if="columnIndex === 2" @click="$emit('move-card', columnIndex, columnIndex - 1, cardIndex)">
                    Назад
                </button>
                <button v-if="columnIndex === 0" @click="$emit('remove-card', columnIndex, cardIndex)">
                    Удалить
                </button>
            </div>

            <p v-if="card.returnReason"><strong>Причина возврата:</strong> {{ card.returnReason }}</p>
        </div>
    `
});

Vue.component('board', {
    data() {
        return {
            columns: [
                { title: 'Запланированные задачи', cards: [] },
                { title: 'Задачи в работе', cards: [] },
                { title: 'Тестирование', cards: [] },
                { title: 'Выполненные задачи', cards: [] }
            ]
        };
    },
    created() {
        this.loadData();
    },
    methods: {
        addCard(columnIndex) {
            const title = prompt("Введите заголовок задачи:");
            const description = prompt("Введите описание задачи:");
            const deadlineInput = prompt("Введите дату дедлайна:", new Date().toISOString().split('T')[0]);

            const timestamp = new Date().toLocaleString();

            if (title && description && deadlineInput) {
                const newCard = {
                    title,
                    description,
                    deadline: deadlineInput,
                    createdAt: timestamp,
                    updatedAt: timestamp,
                    completed: false,
                    overdue: false
                };
                this.columns[columnIndex].cards.push(newCard);
                this.saveData();
            }
        },
        removeCard(columnIndex, cardIndex) {
            if (confirm("Вы уверены, что хотите удалить эту карточку?")) {
                this.columns[columnIndex].cards.splice(cardIndex, 1);
                this.saveData();
            }
        },
        moveCard(sourceColumnIndex, targetColumnIndex, cardIndex) {
            const card = this.columns[sourceColumnIndex].cards[cardIndex];

            if (targetColumnIndex === 1 && sourceColumnIndex === 2) {
                const reason = prompt("Введите причину возврата:");
                if (reason) {
                    card.returnReason = reason;
                }
            }

            this.columns[targetColumnIndex].cards.push(card);
            this.columns[sourceColumnIndex].cards.splice(cardIndex, 1);
            this.checkOverdue(card);
            this.saveData();
        },
        checkOverdue(card) {
            const today = new Date();
            const deadline = new Date(card.deadline);
            card.overdue = deadline < today && !card.completed;
        },
        saveData() {
            localStorage.setItem('kanbanData', JSON.stringify(this.columns));
        },
        loadData() {
            const data = localStorage.getItem('kanbanData');
            if (data) {
                this.columns = JSON.parse(data);
                this.columns.forEach(column => {
                    column.cards.forEach(card => this.checkOverdue(card));
                });
            }
        },
        onCardUpdated() {
            this.saveData();
        }
    },
    template: `
        <div class="board">
            <div class="column" v-for="(column, index) in columns" :key="index">
                <h2>{{ column.title }}</h2>
                <button v-if="index === 0" @click="addCard(index)">Добавить задачу</button>
                <div v-for="(card, cardIndex) in column.cards" :key="cardIndex">
                    <card 
                        :card="card" 
                        :columnIndex="index" 
                        :cardIndex="cardIndex" 
                        @move-card="moveCard" 
                        @remove-card="removeCard"
                        @card-updated="onCardUpdated"
                    ></card>
                </div>
            </div>
        </div>
    `
});

new Vue({
    el: '#app'
});