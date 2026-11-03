"use strict";
const UE = require("ue");

// Translations are grouped by message so changes to a line can be reviewed together.
// The order matches the shipping game's Game.locres cultures, including its extra he resource.
const cultures = ["zh-Hans","zh-Hant","en-US","ja","ko","fr","de","it","es-ES","es-419","pt-PT","pt-BR","ru","th","vi","he"];
const lines = {
    name: [
        "梦中身","夢中身","Dreambody","夢中の身","꿈속의 몸","Corps de songe","Traumgestalt","Corpo di sogno","Cuerpo de ensueño","Cuerpo de ensueño","Corpo de sonho","Corpo de sonho","Тело из сна","ร่างในฝัน","Thân Trong Mộng","גוף בחלום"
    ],
    kind: [
        "剧情道具","劇情道具","Story Item","クエストアイテム","스토리 아이템","Objet d'histoire","Handlungsgegenstand","Oggetto della Storia","Objeto de historia","Objeto de historia","Item da história","Item de História","Сюжетные предметы","ไอเทมเนื้อเรื่อง","Vật Phẩm Cốt Truyện","חפץ עלילתי"
    ],
    description: [
        "引壶觞心铸梦，执情义梦作身。湖天一镜妆残照，且叫刀兵劝故人。少主一战后，于陆家村湖畔升降梯出口附近使用回到残阳湖畔，靠近升降梯即可离梦。",
        "引壺觴心鑄夢，執情義夢作身。湖天一鏡妝殘照，且叫刀兵勸故人。少主一戰後，於陸家村湖畔升降梯出口附近使用回到殘陽湖畔，靠近升降梯即可離夢。",
        "With wine in hand, the heart forges a dream; with love and loyalty, the dream takes form. Lake and sky mirror the last light of day; let blades raise a toast to an old friend. After the duel with the Young Mistress, use this near the lakeside lift exit in the Village of Lu to return to the lakeside at sunset. Approach the lift to leave the dream.",
        "酒盃を手に、心は夢を鋳る。情と義を抱き、夢をこの身となす。湖と空は一枚の鏡となり、残照をまとう。いざ刃をもって旧友に一献。姫君との戦いの後、陸家村の湖畔にある昇降機の出口付近で使うと、夕陽の湖畔へ戻れる。昇降機に近づけば夢から覚める。",
        "술잔을 들어 마음으로 꿈을 빚고, 정과 의리를 품어 꿈으로 몸을 이룬다. 호수와 하늘이 한 거울 되어 저녁빛을 두르니, 칼날로 옛 벗에게 한 잔을 권하리. 소주와 싸운 뒤 육가촌 호숫가 승강기 출구 근처에서 사용하면 저무는 노을의 호숫가로 돌아간다. 승강기에 가까이 가면 꿈에서 깨어난다.",
        "La coupe à la main, le cœur forge un songe ; par l’affection et la loyauté, le songe prend corps. Lac et ciel, un seul miroir paré des derniers feux du jour ; que les lames portent un toast à un vieil ami. Après le duel contre la Jeune Maîtresse, utilisez cet objet près de la sortie du monte-charge, au bord du lac du village de Lu, pour retrouver le rivage au soleil couchant. Approchez-vous du monte-charge pour quitter le songe.",
        "Mit dem Weinbecher in der Hand schmiedet das Herz einen Traum; aus Zuneigung und Treue nimmt der Traum Gestalt an. See und Himmel spiegeln das letzte Abendlicht; lasst die Klingen auf einen alten Freund anstoßen. Benutze diesen Gegenstand nach dem Duell mit der jungen Herrin nahe dem Ausgang des Aufzugs am Seeufer im Dorf Lu, um ans Ufer im Sonnenuntergang zurückzukehren. Nähere dich dem Aufzug, um den Traum zu verlassen.",
        "Con la coppa in mano, il cuore forgia un sogno; nell’affetto e nella lealtà, il sogno prende corpo. Lago e cielo, un solo specchio adorno dell’ultima luce; che le lame brindino a un vecchio amico. Dopo il duello con la Giovane Signora, usa questo oggetto vicino all’uscita del montacarichi sulla riva del lago, al Villaggio di Lu, per tornare alla riva al tramonto. Avvicinati al montacarichi per lasciare il sogno.",
        "Copa en mano, el corazón forja un sueño; con afecto y lealtad, el sueño cobra cuerpo. Lago y cielo, un solo espejo vestido de la última luz; que las hojas brinden por un viejo amigo. Tras el duelo con la Joven Maestra, usa este objeto cerca de la salida del ascensor junto al lago del Pueblo de Lu para regresar a la orilla al atardecer. Acércate al ascensor para abandonar el sueño.",
        "Copa en mano, el corazón forja un sueño; con afecto y lealtad, el sueño toma forma. Lago y cielo, un solo espejo adornado con la última luz; que las hojas brinden por un viejo amigo. Después del duelo con la Joven Ama, usa este objeto cerca de la salida del elevador junto al lago de la Aldea de Lu para volver a la orilla al atardecer. Acércate al elevador para dejar el sueño.",
        "De taça na mão, o coração forja um sonho; com afeto e lealdade, o sonho ganha corpo. Lago e céu, um só espelho vestido da última luz; que as lâminas brindem a um velho amigo. Depois do duelo com a Jovem Mestra, usa este objeto perto da saída do elevador junto ao lago da Aldeia de Lu para regressares à margem ao pôr do sol. Aproxima-te do elevador para deixares o sonho.",
        "Com a taça na mão, o coração forja um sonho; com afeto e lealdade, o sonho ganha corpo. Lago e céu, um só espelho adornado pela última luz; que as lâminas brindem a um velho amigo. Após o duelo com a Jovem Donzela, use este objeto perto da saída do elevador à margem do lago, no Vilarejo de Lu, para voltar à beira do lago ao pôr do sol. Aproxime-se do elevador para deixar o sonho.",
        "С чашей вина в руке сердце куёт сон; верность и привязанность даруют сну облик. Озеро и небо — одно зеркало, украшенное последним светом дня; пусть клинки поднимут тост за старого друга. После поединка с Юной госпожой используй этот предмет возле выхода с подъёмника у озера в деревне Лу, чтобы вернуться на берег в лучах заката. Подойди к подъёмнику, чтобы покинуть сон.",
        "ยกจอกสุรา ให้ใจหลอมสร้างฝัน ยึดมั่นในรักและคุณธรรม ให้ฝันก่อเป็นกาย ทะเลสาบกับฟ้ารวมเป็นกระจกหนึ่ง ประดับด้วยแสงสุดท้ายของวัน ให้คมดาบเชื้อเชิญสหายเก่าร่วมดื่ม หลังประลองกับประมุขน้อย ใช้สิ่งนี้ใกล้ทางออกของลิฟต์ริมทะเลสาบในหมู่บ้านสกุลลู่ เพื่อกลับไปยังริมทะเลสาบยามตะวันรอน เข้าใกล้ลิฟต์เพื่อออกจากความฝัน",
        "Nâng chén rượu, lòng đúc mộng; giữ tình nghĩa, mộng thành thân. Hồ trời một tấm gương tô nắng muộn, hãy để đao binh mời cố nhân một chén. Sau trận đấu với Thiếu Chủ, dùng vật này gần lối ra của thang nâng bên Bờ Hồ ở Thôn Lục Gia để trở lại bờ hồ dưới ánh tà dương. Đến gần thang nâng để rời mộng.",
        "כוס יין ביד, הלב מחשל חלום; באהבה ובנאמנות, החלום לובש גוף. האגם והשמים הם מראה אחת, עטויה באורו האחרון של היום; ירימו הלהבים כוס לכבוד ידיד ותיק. לאחר הדו־קרב עם הגבירה הצעירה, אפשר להשתמש בחפץ זה ליד היציאה מהמעלית שעל שפת האגם בכפר לו, כדי לשוב אל האגם בשעת השקיעה. התקרבות למעלית מחזירה מן החלום."
    ],
    verse: [
        "隙中驹，石中火，梦中身。","隙中駒，石中火，夢中身。",
        "A colt glimpsed through a crack, a spark struck from stone, a self within a dream.",
        "隙を過ぎる駒、石に散る火、夢の中のこの身。","틈새로 스치는 망아지, 돌에서 튀는 불꽃, 꿈속의 이 몸.",
        "Un poulain entrevu par une fente, une étincelle jaillie de la pierre, un corps au creux d’un songe.",
        "Ein Fohlen, durch einen Spalt erblickt. Ein Funke aus dem Stein. Ein Ich im Traum.",
        "Un puledro intravisto da uno spiraglio, una scintilla dalla pietra, un corpo dentro un sogno.",
        "Un potro que asoma por un resquicio, una chispa de la piedra, un cuerpo en un sueño.",
        "Un potro que pasa tras una rendija, una chispa que salta de la piedra, un cuerpo dentro de un sueño.",
        "Um potro entrevisto por uma fresta, uma faísca arrancada à pedra, um corpo dentro de um sonho.",
        "Um potro de relance por uma fresta, uma faísca que salta da pedra, um corpo dentro de um sonho.",
        "Мелькнул в просвете жеребёнок, из камня высеклась искра, во сне явился мой облик.",
        "อาชาแวบผ่านช่องแคบ ประกายไฟแลบจากหิน ร่างนี้อยู่ในฝัน",
        "Câu qua khe cửa, lửa lóe trong đá, thân ở trong mộng.",
        "סייח חולף מבעד לסדק, ניצוץ ניתז מאבן, גוף בתוך חלום."
    ],
    locked: [
        "请待斜阳水畔见故人。","請待斜陽水畔見故人。","When the sun hangs low, an old friend awaits by the water.",
        "斜陽の水辺にて、旧き友との再会を待たれよ。","해 기우는 물가에서 옛 벗을 만날 때를 기다리소서.",
        "Quand le soleil déclinera, une vieille connaissance vous attendra au bord de l’eau.","Wenn die Sonne sinkt, wartet am Wasser ein vertrautes Gesicht.",
        "Quando il sole declina, un volto familiare ti attende in riva all’acqua.","Al caer el sol, alguien de antaño te espera junto al agua.","Al caer el sol, alguien de otros tiempos te espera a la orilla del agua.",
        "Quando o sol se puser, um rosto familiar espera por ti à beira da água.","Quando o sol baixar, alguém de outros tempos espera por você à beira da água.",
        "Когда солнце склонится к закату, у воды тебя встретит старый друг.","ครั้นตะวันคล้อย จงรอพบสหายเก่าที่ริมน้ำ","Hãy đợi ngày gặp cố nhân bên bờ nước lúc chiều tà.","כשתיטה השמש לערוב, דמות מוכרת תחכה לך על שפת המים."
    ],
    exitOnly: [
        "请至陆家村湖畔的升降梯出口，再使用梦中身。","請至陸家村湖畔的升降梯出口，再使用夢中身。","Use Dreambody at the lakeside lift exit in the Village of Lu.",
        "陸家村の湖畔にある昇降機の出口で、夢中の身を使ってください。","육가촌 호숫가 승강기 출구에서 꿈속의 몸을 사용하세요.",
        "Utilisez le Corps de songe à la sortie du monte-charge, au bord du lac du village de Lu.","Benutze die Traumgestalt am Ausgang des Aufzugs am Seeufer im Dorf Lu.",
        "Usa il Corpo di sogno all’uscita del montacarichi sulla riva del lago, al Villaggio di Lu.","Usa el Cuerpo de ensueño en la salida del ascensor junto al lago del Pueblo de Lu.","Usa el Cuerpo de ensueño en la salida del elevador junto al lago de la Aldea de Lu.",
        "Usa o Corpo de sonho à saída do elevador junto ao lago da Aldeia de Lu.","Use o Corpo de sonho na saída do elevador à margem do lago no Vilarejo de Lu.",
        "Воспользуйся зеркалом у выхода с подъёмника на берегу озера в деревне Лу.","จงใช้ร่างในฝันที่ทางออกของลิฟต์ริมทะเลสาบในหมู่บ้านสกุลลู่","Hãy dùng Thân Trong Mộng tại lối ra của thang nâng bên Bờ Hồ ở Thôn Lục Gia.","אפשר להשתמש במראה ליד היציאה מהמעלית שעל שפת האגם בכפר לו."
    ],
    combat: [
        "战斗中无法入梦。","戰鬥中無法入夢。","You cannot enter the dream during combat.","戦闘中は夢に入れません。","전투 중에는 꿈에 들 수 없습니다.",
        "Impossible d’entrer dans le songe en plein combat.","Im Kampf kannst du den Traum nicht betreten.","Non puoi entrare nel sogno durante un combattimento.","No puedes entrar en el sueño durante el combate.","No puedes entrar al sueño durante un combate.",
        "Não podes entrar no sonho durante o combate.","Você não pode entrar no sonho durante o combate.","Во время боя войти в сон нельзя.","ไม่อาจเข้าสู่ความฝันระหว่างต่อสู้","Không thể nhập mộng khi đang giao chiến.","אי אפשר להיכנס לחלום בזמן קרב."
    ],
    already: [
        "已身在梦中。走向湖畔升降梯出口，即可回到来处。","已身在夢中。走向湖畔升降梯出口，即可回到來處。","You are already dreaming. Walk through the lakeside lift exit to return.",
        "すでに夢の中です。湖畔の昇降機の出口を抜けると元の場所へ戻れます。","이미 꿈속입니다. 호숫가 승강기 출구를 지나면 원래 자리로 돌아갑니다.",
        "Vous rêvez déjà. Repassez la sortie du monte-charge pour revenir.","Du träumst bereits. Geh durch den Ausgang am Seeaufzug, um zurückzukehren.","Stai già sognando. Attraversa l’uscita del montacarichi sul lago per tornare.",
        "Ya estás soñando. Cruza la salida del ascensor junto al lago para volver.","Ya estás soñando. Cruza la salida del elevador junto al lago para volver.",
        "Já estás a sonhar. Atravessa a saída do elevador junto ao lago para regressares.","Você já está sonhando. Atravesse a saída do elevador junto ao lago para voltar.",
        "Ты уже во сне. Чтобы вернуться, пройди через выход у озёрного подъёмника.","อยู่ในความฝันแล้ว เดินผ่านทางออกของลิฟต์ริมทะเลสาบเพื่อกลับไปยังที่เดิม","Đã ở trong mộng. Hãy bước qua lối ra của thang nâng bên hồ để trở về.","החלום כבר כאן. כדי לחזור, יש לעבור ביציאה מהמעלית שליד האגם."
    ],
    entered: [
        "梦中身 · 湖畔。再走向升降梯出口，便可离梦。","夢中身 · 湖畔。再走向升降梯出口，便可離夢。","Dreambody · Lakeside. Walk through the lift exit to leave the dream.",
        "夢中の身・湖畔。昇降機の出口を抜ければ夢から覚める。","꿈속의 몸 · 호숫가. 승강기 출구를 지나면 꿈에서 깨어난다.",
        "Corps de songe · Rivage du lac. Repassez la sortie du monte-charge pour quitter le songe.","Traumgestalt · Seeufer. Geh durch den Aufzugsausgang, um den Traum zu verlassen.","Corpo di sogno · Riva del lago. Attraversa l’uscita del montacarichi per lasciare il sogno.",
        "Cuerpo de ensueño · Orilla del lago. Cruza la salida del ascensor para abandonar el sueño.","Cuerpo de ensueño · Orilla del lago. Cruza la salida del elevador para dejar el sueño.",
        "Corpo de sonho · Margem do Lago. Atravessa a saída do elevador para deixares o sonho.","Corpo de sonho · Margem do Lago. Atravesse a saída do elevador para deixar o sonho.",
        "Тело из сна · Берег озера. Пройди через выход у подъёмника, чтобы проснуться.","ร่างในฝัน · ริมทะเลสาบ เดินผ่านทางออกของลิฟต์เพื่อออกจากความฝัน","Thân Trong Mộng · Bờ Hồ. Qua lối ra của thang nâng để rời mộng.","גוף בחלום · שפת האגם. מעבר ביציאה מהמעלית מחזיר מן החלום."
    ],
    sceneUnavailable: [
        "湖畔景物尚未就绪，请稍后再试。","湖畔景物尚未就緒，請稍後再試。","The lakeside scene is not ready. Try again in a moment.","湖畔の風景を読み込んでいます。しばらくしてからお試しください。","호숫가 풍경을 불러오는 중입니다. 잠시 후 다시 시도하세요.",
        "Le rivage n’est pas encore prêt. Réessayez dans un instant.","Die Umgebung am See ist noch nicht geladen. Versuche es gleich noch einmal.","La riva del lago non è ancora pronta. Riprova tra poco.",
        "La orilla del lago aún no está lista. Inténtalo de nuevo en un momento.","La orilla del lago aún no está lista. Vuelve a intentarlo en un momento.","A margem do lago ainda não está pronta. Tenta novamente dentro de instantes.","A margem do lago ainda não está pronta. Tente novamente em instantes.",
        "Берег озера ещё не загрузился. Попробуй чуть позже.","ฉากริมทะเลสาบยังไม่พร้อม โปรดลองอีกครั้งในอีกสักครู่","Cảnh bên hồ chưa sẵn sàng. Xin thử lại sau giây lát.","הנוף שעל שפת האגם עדיין בטעינה. אפשר לנסות שוב בעוד רגע."
    ],
    filmUnavailable: [
        "未能播放湖畔坍塌动画。","未能播放湖畔坍塌動畫。","The lakeside collapse sequence could not be played.","湖畔の崩落場面を再生できませんでした。","호숫가 붕괴 장면을 재생할 수 없습니다.",
        "La scène de l’effondrement au bord du lac n’a pas pu être lue.","Die Einsturzszene am See konnte nicht abgespielt werden.","Non è stato possibile riprodurre la scena del crollo sul lago.",
        "No se ha podido reproducir la escena del derrumbe junto al lago.","No se pudo reproducir la escena del derrumbe junto al lago.","Não foi possível reproduzir a cena do desabamento junto ao lago.","Não foi possível reproduzir a cena do desabamento à margem do lago.",
        "Не удалось воспроизвести сцену обрушения у озера.","ไม่สามารถเล่นฉากพังถล่มริมทะเลสาบได้","Không thể phát cảnh sụp đổ bên hồ.","לא ניתן להציג את סצנת הקריסה שעל שפת האגם."
    ],
    menu: [
        "请先关闭系统菜单再重试。","請先關閉系統選單再重試。","Close the system menu and try again.","システムメニューを閉じてから、もう一度お試しください。","시스템 메뉴를 닫고 다시 시도하세요.",
        "Fermez le menu système et réessayez.","Schließe das Systemmenü und versuche es erneut.","Chiudi il menu di sistema e riprova.","Cierra el menú del sistema y vuelve a intentarlo.","Cierra el menú del sistema y vuelve a intentarlo.",
        "Fecha o menu do sistema e tenta novamente.","Feche o menu do sistema e tente outra vez.","Закрой системное меню и попробуй снова.","ปิดเมนูระบบแล้วลองอีกครั้ง","Hãy đóng trình đơn hệ thống rồi thử lại.","יש לסגור את תפריט המערכת ולנסות שוב."
    ],
    moved: [
        "已经离开湖畔升降梯出口。","已經離開湖畔升降梯出口。","You have moved away from the lakeside lift exit.","湖畔の昇降機の出口から離れました。","호숫가 승강기 출구에서 벗어났습니다.",
        "Vous vous êtes éloigné de la sortie du monte-charge.","Du hast dich vom Ausgang des Aufzugs entfernt.","Ti sei allontanato dall’uscita del montacarichi.",
        "Te has alejado de la salida del ascensor.","Te alejaste de la salida del elevador.","Afastaste-te da saída do elevador.","Você se afastou da saída do elevador.",
        "Ты отошёл от выхода у подъёмника.","คุณออกห่างจากทางออกของลิฟต์ริมทะเลสาบแล้ว","Đã rời khỏi lối ra của thang nâng bên hồ.","היציאה מהמעלית שעל שפת האגם כבר רחוקה מדי."
    ],
    failed: [
        "未能进入回忆。","未能進入回憶。","The memory could not be entered.","追憶に入れませんでした。","회상에 들어갈 수 없습니다.","Impossible de rejoindre le souvenir.","Die Erinnerung lässt sich nicht betreten.","Non è stato possibile entrare nel ricordo.","No se ha podido entrar en el recuerdo.","No se pudo entrar al recuerdo.","Não foi possível entrar na memória.","Não foi possível entrar na lembrança.","Не удалось войти в воспоминание.","ไม่อาจเข้าสู่ห้วงความทรงจำได้","Không thể bước vào hồi ức.","לא ניתן להיכנס לזיכרון."
    ]
};

function cultureIndex(language) {
    const [base, ...parts] = String(language || "en").trim().toLowerCase().replace(/_/g, "-").split("-");
    let culture = base;
    if (base === "zh") {
        const traditional = parts.includes("hant") || (!parts.includes("hans") && parts.some(p => ["tw","hk","mo"].includes(p)));
        culture = traditional ? "zh-Hant" : "zh-Hans";
    } else if (base === "es") {
        culture = parts.some(p => /^(419|ar|bo|cl|co|cr|cu|do|ec|gt|hn|mx|ni|pa|pe|pr|py|sv|us|uy|ve)$/.test(p)) ? "es-419" : "es-ES";
    } else if (base === "pt") {
        culture = parts.includes("br") ? "pt-BR" : "pt-PT";
    } else if (base === "iw") {
        culture = "he";
    }
    const index = cultures.indexOf(culture);
    return index < 0 ? cultures.indexOf("en-US") : index;
}

// The game UI language can be changed independently of the OS, formatting locale, and audio.
function text(key) {
    return lines[key][cultureIndex(UE.KismetInternationalizationLibrary.GetCurrentLanguage())];
}

// The cooked inventory row also has native localization keys. Register those keys without replacing
// any of the game's Game.locres files. Inventory widgets still render the selected translation directly.
function registerItemText() {
    for (const [key, field] of [["DreamBody_Name","name"],["DreamBody_Description","description"]]) {
        const entry = new UE.PolyglotTextData();
        entry.Category = UE.ELocalizedTextSourceCategory.Game;
        entry.Namespace = "Default";
        entry.Key = key;
        entry.NativeCulture = "zh-Hans";
        entry.NativeString = lines[field][0];
        for (let i = 0; i < cultures.length; i++) entry.LocalizedStrings.Add(cultures[i], lines[field][i]);
        UE.KismetTextLibrary.PolyglotDataToText(entry);
    }
}
exports.text = text;
exports.registerItemText = registerItemText;
