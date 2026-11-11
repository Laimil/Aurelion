// Перезаписує tests/cases.json поточною поведінкою ядра. Запускати ЛИШЕ після свідомої зміни даних чи правил.
import { writeFileSync } from 'node:fs';
import { load } from './load.mjs';
const { t } = load();
const uk = ["І прийде Темрява.","Ми чекаємо світанку.","Я не хочу помирати, коханий.","Ти чуєш мене?","Передай мені меч, пані Вістрал.","Темрява забере твою душу і твоє тіло.","Що ти думаєш про Крейна?","Наша сила вічна.","Вогонь горить у старому храмі.","Я знаю, що ти не звикнеш.","Я тебе кохаю. Ти моя фортеця."];
const dk = ["Наша сила вічна.","Ти чуєш мене?","Я не хочу помирати, коханий."];
const rn = ["Kaen drau khael'drath.","Draer shael, shae'ren?","Drau no druul vaen.","Vistral'na thrae'vaer shuur'kael.","Khel'n vaer khael."];
const gen = ["вогонь","храм","ніч","дракон","літописець"];
writeFileSync(new URL('../tests/cases.json', import.meta.url), JSON.stringify({
  toRune: [...uk.map((s) => ({ in: s, out: t.toRune(s).text })), ...dk.map((s) => ({ in: s, register: 'darkness', out: t.toRune(s, { register: 'darkness' }).text }))],
  toUk: rn.map((s) => ({ in: s, out: t.toUk(s).text })),
  generate: gen.map((s) => ({ in: s, out: t.generate(s) })),
  sameStem: [["храм","храмі"],["кохаю","кохати"],["меч","меча"],["Вогнем","вогню"],["вогонь","вогню"],["світанок","світанку"],["ніч","ночі"],["рік","року"],["українець","українця"],["вересень","вересня"]],
}, null, 1));
