import { z } from 'zod';

export const REL_STATS = ['friendship', 'romance', 'trust', 'rivalry'];
export const EXPRESSIONS = ['neutral', 'happy', 'angry', 'sad', 'surprised', 'nervous', 'confident', 'embarrassed'];
const Op = z.enum(['>=', '<=', '>', '<', '==', '!=']);
const Id = z.string().regex(/^[a-zA-Z0-9_-]+$/);

export const Condition = z.lazy(() =>
  z.union([
    z.object({ rel: z.string(), stat: z.enum(REL_STATS), op: Op, value: z.number() }).strict(),
    z.object({ stat: z.string(), op: Op, value: z.number() }).strict(),
    z.object({ flag: z.string(), is: z.boolean().default(true) }).strict(),
    z.object({ item: z.string(), has: z.boolean().default(true) }).strict(),
    z.object({ all: z.array(Condition) }).strict(),
    z.object({ any: z.array(Condition) }).strict(),
    z.object({ not: Condition }).strict(),
  ])
);

export const Effect = z.discriminatedUnion('type', [
  z.object({ type: z.literal('rel'), char: z.string(), stat: z.enum(REL_STATS), delta: z.number() }),
  z.object({ type: z.literal('stat'), stat: z.string(), delta: z.number() }),
  z.object({ type: z.literal('flag'), key: z.string(), value: z.boolean().default(true) }),
  z.object({ type: z.literal('item'), id: z.string(), op: z.enum(['add', 'remove']).default('add') }),
]);

const S = (type, shape = {}) => z.object({ type: z.literal(type), if: Condition.optional(), ...shape });
const Pos = z.enum(['left', 'center', 'right']);
const Expr = z.enum(EXPRESSIONS);
const Move = z.enum(['fade', 'left', 'right']);

const plain = [
  S('bg', { name: z.string() }),
  S('show', { char: z.string(), position: Pos, expression: Expr.default('neutral'), enter: Move.default('fade') }),
  S('hide', { char: z.string(), exit: Move.default('fade') }),
  S('move', { char: z.string(), position: Pos }),
  S('expr', { char: z.string(), expression: Expr }),
  S('say', { char: z.string(), text: z.string().min(1), expression: Expr.optional() }),
  S('narrate', { text: z.string().min(1) }),
  S('camera', {
    effect: z.enum(['zoom', 'pan', 'shake', 'fade', 'flash', 'reset']),
    amount: z.number().optional(),
    to: z.enum(['black', 'clear']).optional(),
    wait: z.number().max(5000).optional(),
  }),
  S('music', { track: z.string() }),
  S('sfx', { name: z.string() }),
  S('effects', { effects: z.array(Effect).min(1) }),
  S('jump', { scene: z.string() }),
  S('end', { title: z.string().optional(), text: z.string().optional() }),
];
export const PlainStep = z.discriminatedUnion('type', plain);

export const Option = z.object({
  id: Id,
  text: z.string(),
  requires: Condition.optional(),
  hidden: z.boolean().default(false), // hide entirely while requirement is unmet
  lockedHint: z.string().optional(), // shown on a locked option (no numbers!)
  premium: z.boolean().default(false),
  effects: z.array(Effect).default([]),
  summary: z.string().optional(), // shown on the episode summary
  then: z.array(PlainStep).default([]),
  goto: z.string().optional(),
});

export const ChoiceStep = S('choice', {
  id: Id,
  prompt: z.string().default('What will you do?'),
  options: z.array(Option).min(2),
});
export const Step = z.discriminatedUnion('type', [...plain, ChoiceStep]);
export const Scene = z.object({ id: Id, steps: z.array(Step).min(1) });

export const Appearance = z.object({
  skin: z.string(), hair: z.string(), hairColor: z.string(), eyes: z.string(), brows: z.string(),
  face: z.string(), outfit: z.string(), outfitColor: z.string(), accessory: z.string(),
});
export const Character = z.object({
  name: z.string(), color: z.string(), description: z.string(), personality: z.string(),
  portrait: z.string().max(40).default(''),
  appearance: Appearance,
  startRelationship: z.record(z.number()).default({}),
  hiddenStats: z.array(z.enum(REL_STATS)).default([]),
});

export const Story = z.object({
  id: Id, title: z.string(), tagline: z.string(), setting: z.string(),
  genre: z.array(z.string()), tags: z.array(z.string()).default([]),
  characters: z.record(Character),
  items: z.record(z.object({ name: z.string(), icon: z.string(), description: z.string() })).default({}),
  seasons: z.array(z.object({
    id: Id, title: z.string(),
    episodes: z.array(z.object({
      id: Id, title: z.string(), description: z.string(),
      file: z.string().regex(/^[a-z0-9-]+\.(json|story)$/).optional(),
      published: z.boolean().default(true),
    })),
  })),
});

export const Episode = z.object({ id: Id, title: z.string(), start: z.string(), scenes: z.array(Scene).min(1) })
  .superRefine((ep, ctx) => {
    const ids = new Set(ep.scenes.map((s) => s.id));
    const check = (target, where) => {
      if (target && !ids.has(target)) ctx.addIssue({ code: 'custom', message: `${where}: unknown scene "${target}"` });
    };
    check(ep.start, 'start');
    for (const sc of ep.scenes)
      for (const st of sc.steps) {
        if (st.type === 'jump') check(st.scene, sc.id);
        if (st.type === 'choice')
          for (const o of st.options) {
            check(o.goto, `${sc.id}/${o.id}`);
            for (const t of o.then) if (t.type === 'jump') check(t.scene, `${sc.id}/${o.id}`);
          }
      }
  });
