import { useForm } from '@inertiajs/react';
import { Check, ChevronsUpDown } from 'lucide-react';
import type { FormEvent } from 'react';
import { useMemo, useState } from 'react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { useTranslate } from '@/hooks/use-translate';

type Option = {
    value: string;
    label: string;
};

type AssessmentQuestionFormData = {
    _method?: 'patch';
    mode: 'ai' | 'manual';
    skill_id: string;
    difficulty: string;
    total_questions: number;
    manual_questions: Array<{
        question: string;
        option_a: string;
        option_b: string;
        option_c: string;
        option_d: string;
        correct_option_index: string;
    }>;
    question: string;
    option_a: string;
    option_b: string;
    option_c: string;
    option_d: string;
    correct_option_index: string;
    is_active: boolean;
};

export type AssessmentQuestionValue = {
    id: number;
    skill_id: string;
    difficulty: string;
    question: string;
    option_a: string;
    option_b: string;
    option_c: string;
    option_d: string;
    correct_option_index: string;
    is_active: boolean;
};

export function AssessmentQuestionForm({
    action,
    method = 'post',
    difficultyOptions,
    question,
    skillOptions,
}: {
    action: string;
    method?: 'patch' | 'post';
    difficultyOptions: Option[];
    question?: AssessmentQuestionValue;
    skillOptions: Option[];
}) {
    const { t } = useTranslate();
    const form = useForm<AssessmentQuestionFormData>({
        ...(method === 'patch' ? { _method: 'patch' as const } : {}),
        mode: 'manual',
        skill_id: question?.skill_id ?? '',
        difficulty: question?.difficulty ?? 'medium',
        total_questions: 5,
        manual_questions: [
            {
                question: '',
                option_a: '',
                option_b: '',
                option_c: '',
                option_d: '',
                correct_option_index: '0',
            },
        ],
        question: question?.question ?? '',
        option_a: question?.option_a ?? '',
        option_b: question?.option_b ?? '',
        option_c: question?.option_c ?? '',
        option_d: question?.option_d ?? '',
        correct_option_index: question?.correct_option_index ?? '0',
        is_active: question?.is_active ?? true,
    });

    const isCreate = method === 'post';
    const isAiMode = form.data.mode === 'ai';
    const questionItems = form.data.manual_questions;

    function addManualQuestion() {
        form.setData('manual_questions', [
            ...form.data.manual_questions,
            {
                question: '',
                option_a: '',
                option_b: '',
                option_c: '',
                option_d: '',
                correct_option_index: '0',
            },
        ]);
    }

    function removeManualQuestion(index: number) {
        const next = form.data.manual_questions.filter((_, i) => i !== index);
        form.setData(
            'manual_questions',
            next.length > 0
                ? next
                : [
                      {
                          question: '',
                          option_a: '',
                          option_b: '',
                          option_c: '',
                          option_d: '',
                          correct_option_index: '0',
                      },
                  ],
        );
    }

    function updateManualQuestion(
        index: number,
        field:
            | 'correct_option_index'
            | 'option_a'
            | 'option_b'
            | 'option_c'
            | 'option_d'
            | 'question',
        value: string,
    ) {
        const next = [...form.data.manual_questions];
        next[index] = {
            ...next[index],
            [field]: value,
        };
        form.setData('manual_questions', next);
    }

    function getError(key: string) {
        return (form.errors as Record<string, string>)[key];
    }

    function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        form.post(action, {
            preserveScroll: true,
        });
    }

    return (
        <form className="grid gap-6 xl:grid-cols-[1fr_320px]" onSubmit={submit}>
            <section className="space-y-5 rounded-lg border bg-white p-5 shadow-sm">
                <div className="grid gap-2">
                    <Label htmlFor="skill_id">{t("admin.assessment.form.skill")}</Label>
                    <SearchableOptionSelect
                        onChange={(value) => form.setData('skill_id', value)}
                        options={skillOptions}
                        placeholder={t("admin.assessment.form.skill_placeholder")}
                        value={form.data.skill_id}
                    />
                    <InputError message={form.errors.skill_id} />
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="difficulty">{t("admin.assessment.form.level")}</Label>
                    <select
                        className="h-10 rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                        id="difficulty"
                        name="difficulty"
                        onChange={(event) =>
                            form.setData('difficulty', event.target.value)
                        }
                        required
                        value={form.data.difficulty}
                    >
                        {difficultyOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                    <InputError message={form.errors.difficulty} />
                </div>

                {isCreate ? (
                    <div className="grid gap-2">
                        <Label htmlFor="mode">{t("admin.assessment.form.mode")}</Label>
                        <select
                            className="h-10 rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                            id="mode"
                            name="mode"
                            onChange={(event) =>
                                form.setData(
                                    'mode',
                                    event.target.value as 'ai' | 'manual',
                                )
                            }
                            value={form.data.mode}
                        >
                            <option value="manual">{t("admin.assessment.form.mode_manual")}</option>
                            <option value="ai">{t("admin.assessment.form.mode_ai")}</option>
                        </select>
                        <InputError message={form.errors.mode} />
                    </div>
                ) : null}

                {isCreate && isAiMode ? (
                    <div className="grid gap-2">
                        <Label htmlFor="total_questions">{t("admin.assessment.form.ai_count")}</Label>
                        <Input
                            id="total_questions"
                            inputMode="numeric"
                            min={1}
                            max={20}
                            onChange={(event) =>
                                form.setData(
                                    'total_questions',
                                    Number(event.target.value) || 1,
                                )
                            }
                            type="number"
                            value={form.data.total_questions}
                        />
                        <InputError message={form.errors.total_questions} />
                    </div>
                ) : isCreate ? (
                    <>
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-semibold">
                                Soal Manual ({questionItems.length})
                            </h3>
                            <Button
                                onClick={addManualQuestion}
                                size="sm"
                                type="button"
                                variant="outline"
                            >
                                Tambah Soal
                            </Button>
                        </div>

                        {questionItems.map((item, index) => (
                            <div
                                className="space-y-4 rounded-md border p-4"
                                key={`manual-question-${index}`}
                            >
                                <div className="flex items-center justify-between">
                                    <p className="text-sm font-medium">
                                        Pertanyaan #{index + 1}
                                    </p>
                                    {questionItems.length > 1 ? (
                                        <Button
                                            onClick={() =>
                                                removeManualQuestion(index)
                                            }
                                            size="sm"
                                            type="button"
                                            variant="outline"
                                        >
                                            Hapus
                                        </Button>
                                    ) : null}
                                </div>

                                <div className="grid gap-2">
                                    <Label>{t("admin.assessment.form.question")}</Label>
                                    <textarea
                                        className="min-h-24 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                                        onChange={(event) =>
                                            updateManualQuestion(
                                                index,
                                                'question',
                                                event.target.value,
                                            )
                                        }
                                        placeholder={t("admin.assessment.form.question_placeholder")}
                                        required
                                        value={item.question}
                                    />
                                    <InputError
                                        message={getError(
                                            `manual_questions.${index}.question`,
                                        )}
                                    />
                                </div>

                                <div className="grid gap-3 md:grid-cols-2">
                                    <ChoiceField
                                        error={getError(
                                            `manual_questions.${index}.option_a`,
                                        )}
                                        id={`option_a_${index}`}
                                        label={t("admin.assessment.form.option_a")}
                                        onChange={(value) =>
                                            updateManualQuestion(
                                                index,
                                                'option_a',
                                                value,
                                            )
                                        }
                                        value={item.option_a}
                                    />
                                    <ChoiceField
                                        error={getError(
                                            `manual_questions.${index}.option_b`,
                                        )}
                                        id={`option_b_${index}`}
                                        label={t("admin.assessment.form.option_b")}
                                        onChange={(value) =>
                                            updateManualQuestion(
                                                index,
                                                'option_b',
                                                value,
                                            )
                                        }
                                        value={item.option_b}
                                    />
                                    <ChoiceField
                                        error={getError(
                                            `manual_questions.${index}.option_c`,
                                        )}
                                        id={`option_c_${index}`}
                                        label={t("admin.assessment.form.option_c")}
                                        onChange={(value) =>
                                            updateManualQuestion(
                                                index,
                                                'option_c',
                                                value,
                                            )
                                        }
                                        value={item.option_c}
                                    />
                                    <ChoiceField
                                        error={getError(
                                            `manual_questions.${index}.option_d`,
                                        )}
                                        id={`option_d_${index}`}
                                        label={t("admin.assessment.form.option_d")}
                                        onChange={(value) =>
                                            updateManualQuestion(
                                                index,
                                                'option_d',
                                                value,
                                            )
                                        }
                                        value={item.option_d}
                                    />
                                </div>

                                <div className="grid gap-2">
                                    <Label>{t("admin.assessment.form.correct_answer")}</Label>
                                    <select
                                        className="h-10 rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                                        onChange={(event) =>
                                            updateManualQuestion(
                                                index,
                                                'correct_option_index',
                                                event.target.value,
                                            )
                                        }
                                        value={item.correct_option_index}
                                    >
                                        <option value="0">A</option>
                                        <option value="1">B</option>
                                        <option value="2">C</option>
                                        <option value="3">D</option>
                                    </select>
                                    <InputError
                                        message={getError(
                                            `manual_questions.${index}.correct_option_index`,
                                        )}
                                    />
                                </div>
                            </div>
                        ))}
                    </>
                ) : (
                    <>
                        <div className="grid gap-2">
                            <Label htmlFor="question">Pertanyaan</Label>
                            <textarea
                                className="min-h-28 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                                id="question"
                                name="question"
                                onChange={(event) =>
                                    form.setData('question', event.target.value)
                                }
                                placeholder="Masukkan pertanyaan"
                                required
                                value={form.data.question}
                            />
                            <InputError message={form.errors.question} />
                        </div>

                        <div className="grid gap-3 md:grid-cols-2">
                            <ChoiceField
                                error={form.errors.option_a}
                                id="option_a"
                                label="Opsi A"
                                onChange={(value) =>
                                    form.setData('option_a', value)
                                }
                                value={form.data.option_a}
                            />
                            <ChoiceField
                                error={form.errors.option_b}
                                id="option_b"
                                label="Opsi B"
                                onChange={(value) =>
                                    form.setData('option_b', value)
                                }
                                value={form.data.option_b}
                            />
                            <ChoiceField
                                error={form.errors.option_c}
                                id="option_c"
                                label="Opsi C"
                                onChange={(value) =>
                                    form.setData('option_c', value)
                                }
                                value={form.data.option_c}
                            />
                            <ChoiceField
                                error={form.errors.option_d}
                                id="option_d"
                                label="Opsi D"
                                onChange={(value) =>
                                    form.setData('option_d', value)
                                }
                                value={form.data.option_d}
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="correct_option_index">
                                Jawaban Benar
                            </Label>
                            <select
                                className="h-10 rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                                id="correct_option_index"
                                name="correct_option_index"
                                onChange={(event) =>
                                    form.setData(
                                        'correct_option_index',
                                        event.target.value,
                                    )
                                }
                                value={form.data.correct_option_index}
                            >
                                <option value="0">A</option>
                                <option value="1">B</option>
                                <option value="2">C</option>
                                <option value="3">D</option>
                            </select>
                            <InputError
                                message={form.errors.correct_option_index}
                            />
                        </div>
                    </>
                )}
            </section>

            <aside className="space-y-5 rounded-lg border bg-white p-5 shadow-sm">
                <label className="flex items-center gap-3 rounded-md border p-3">
                    <Checkbox
                        checked={form.data.is_active}
                        onCheckedChange={(checked) =>
                            form.setData('is_active', Boolean(checked))
                        }
                    />
                    <span className="text-sm font-medium">{t("admin.assessment.form.is_active")}</span>
                </label>
                <InputError message={form.errors.is_active} />

                <Button
                    className="w-full"
                    disabled={form.processing}
                    type="submit"
                >
                    {form.processing
                        ? t('admin.assessment.form.btn_saving')
                        : isAiMode && isCreate
                          ? 'Generate Soal AI'
                          : t('admin.assessment.form.btn_save_manual')}
                </Button>
            </aside>
        </form>
    );
}

function SearchableOptionSelect({
    onChange,
    options,
    placeholder,
    value,
}: {
    onChange: (value: string) => void;
    options: Option[];
    placeholder: string;
    value: string;
}) {
    const { t } = useTranslate();
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');

    const selected = options.find((option) => option.value === value);
    const filteredOptions = useMemo(() => {
        const normalizedQuery = query.trim().toLowerCase();

        if (!normalizedQuery) {
            return options;
        }

        return options.filter((option) =>
            option.label.toLowerCase().includes(normalizedQuery),
        );
    }, [options, query]);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <button
                    className={cn(
                        'flex h-10 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50',
                        !selected && 'text-muted-foreground',
                    )}
                    id="skill_id"
                    type="button"
                >
                    <span className="truncate">
                        {selected?.label ?? placeholder}
                    </span>
                    <ChevronsUpDown className="ml-2 size-4 shrink-0 text-muted-foreground" />
                </button>
            </PopoverTrigger>
            <PopoverContent
                align="start"
                className="w-[--radix-popover-trigger-width] p-0"
            >
                <div className="border-b px-3 py-2">
                    <input
                        autoFocus
                        className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                        onChange={(event) => setQuery(event.target.value)}
                        placeholder={t("admin.assessment.form.search_skill")}
                        value={query}
                    />
                </div>
                <div className="max-h-64 overflow-y-auto py-1">
                    {filteredOptions.length > 0 ? (
                        filteredOptions.map((option) => (
                            <button
                                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition hover:bg-accent"
                                key={option.value}
                                onClick={() => {
                                    onChange(option.value);
                                    setOpen(false);
                                    setQuery('');
                                }}
                                type="button"
                            >
                                <Check
                                    className={cn(
                                        'size-4 text-primary',
                                        option.value === value
                                            ? 'opacity-100'
                                            : 'opacity-0',
                                    )}
                                />
                                <span className="truncate">{option.label}</span>
                            </button>
                        ))
                    ) : (
                        <p className="px-3 py-4 text-center text-sm text-muted-foreground">
                            Skill tidak ditemukan.
                        </p>
                    )}
                </div>
            </PopoverContent>
        </Popover>
    );
}

function ChoiceField({
    error,
    id,
    label,
    onChange,
    value,
}: {
    error?: string;
    id: string;
    label: string;
    onChange: (value: string) => void;
    value: string;
}) {
    return (
        <div className="grid gap-2">
            <Label htmlFor={id}>{label}</Label>
            <Input
                id={id}
                onChange={(event) => onChange(event.target.value)}
                required
                value={value}
            />
            <InputError message={error} />
        </div>
    );
}
