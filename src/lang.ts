import { defineLangTree } from "sapi-pro";

export const MessageLang = defineLangTree({
	prefix: {
		zh_CN: "§2[自动整理]§r",
		zh_TW: "§2[自動整理]§r",
		en_US: "§2[Sorter]§r",
		ja_JP: "§2[自動整理]§r",
		fr_FR: "§2[Tri Auto]§r",
		pt_BR: "§2[Organizador]§r",
		ko_KR: "§2[자동 정리]§r",
		es_ES: "§2[Organizador]§r",
	},
	backPack: {
		zh_CN: "背包",
		zh_TW: "背包",
		en_US: "Backpack",
		ja_JP: "インベントリ",
		fr_FR: "Sac",
		pt_BR: "Mochila",
		ko_KR: "가방",
		es_ES: "Mochila",
	},
	playerSpawn: {
		loaded: {
			zh_CN: "§2[自动整理] 插件加载成功",
			zh_TW: "§2[自動整理] 插件載入成功",
			en_US: "§2[Sorter] Plugin loaded successfully",
			ja_JP: "§2[自動整理] プラグインの読み込み成功",
			fr_FR: "§2[Tri Auto] Plugin chargé avec succès",
			pt_BR: "§2[Organizador] Plugin carregado com sucesso",
			ko_KR: "§2[자동 정리] 플러그인 로드 성공",
			es_ES: "§2[Organizador] Plugin cargado correctamente",
		},
		openMsg: {
			zh_CN: "§f§l使用 §e/sorter §f§l打开菜单",
			zh_TW: "§f§l使用 §e/sorter §f§l開啟選單",
			en_US: "§f§lUse §e/sorter §f§lto open the menu",
			ja_JP: "§f§l§e/sorter §f§lでメニューを開く",
			fr_FR: "§f§lUtilisez §e/sorter §f§lpour ouvrir le menu",
			pt_BR: "§f§lUse §e/sorter §f§lpara abrir o menu",
			ko_KR: "§f§l§e/sorter §f§l로 메뉴 열기",
			es_ES: "§f§lUsa §e/sorter §f§lpara abrir el menú",
		},
	},
	sortError: {
		zh_CN: "整理错误: ",
		zh_TW: "整理錯誤: ",
		en_US: "Sort error: ",
		ja_JP: "整理エラー: ",
		fr_FR: "Erreur de tri: ",
		pt_BR: "Erro ao organizar: ",
		ko_KR: "정리 오류: ",
		es_ES: "Error al ordenar: ",
	},
	sortSuccess: {
		zh_CN: "整理{target}完成§7({time}ms) ",
		zh_TW: "整理{target}完成§7({time}ms) ",
		en_US: "Sorted {target}§7 ({time}ms)",
		ja_JP: "{target}の整理完了§7 ({time}ms)",
		fr_FR: "{target} trié§7 ({time}ms)",
		pt_BR: "{target} organizado§7 ({time}ms)",
		ko_KR: "{target} 정리 완료§7 ({time}ms)",
		es_ES: "{target} ordenado§7 ({time}ms)",
	},
	userConfigSaved: {
		zh_CN: "配置保存成功!",
		zh_TW: "設定已成功保存!",
		en_US: "Settings saved successfully!",
		ja_JP: "設定が保存されました！",
		fr_FR: "Configuration enregistrée !",
		pt_BR: "Configurações salvas com sucesso!",
		ko_KR: "설정이 저장되었습니다!",
		es_ES: "¡Configuración guardada!",
	},
});

export const CmdLang = defineLangTree({
	r: {
		zh_CN: "整理背包或容器",
		zh_TW: "整理背包或容器",
		en_US: "Sort backpack or container",
		ja_JP: "インベントリまたはコンテナを整理",
		fr_FR: "Trier le sac ou le conteneur",
		pt_BR: "Organizar mochila ou contêiner",
		ko_KR: "가방 또는 컨테이너 정리",
		es_ES: "Ordenar mochila o contenedor",
	},
	sorter: {
		zh_CN: "打开自动整理菜单",
		zh_TW: "開啟自動整理選單",
		en_US: "Open sorter menu",
		ja_JP: "整理メニューを開く",
		fr_FR: "Ouvrir le menu de tri",
		pt_BR: "Abrir menu do organizador",
		ko_KR: "정리 메뉴 열기",
		es_ES: "Abrir menú de organización",
	},
});

export const UILang = defineLangTree({
	dir: {
		zh_CN: "{dir}字形",
		zh_TW: "{dir}方向",
		en_US: "Put In {dir}",
		ja_JP: "{dir}方向",
		fr_FR: "Direction {dir}",
		pt_BR: "Direção {dir}",
		ko_KR: "{dir} 방향",
		es_ES: "Dirección {dir}",
	},
	method: {
		byTable: {
			zh_CN: "按ID表顺序整理(默认)",
			zh_TW: "按ID表順序整理(預設)",
			en_US: "Sort by ID table (default)",
			ja_JP: "IDテーブル順で整理（デフォルト）",
			fr_FR: "Trier par table ID (défaut)",
			pt_BR: "Ordenar por tabela de ID (padrão)",
			ko_KR: "ID 테이블 순 정렬 (기본)",
			es_ES: "Ordenar por tabla de ID (predeterminado)",
		},
		byName: {
			zh_CN: "按字母顺序整理",
			zh_TW: "按字母順序整理",
			en_US: "Sort alphabetically",
			ja_JP: "アルファベット順で整理",
			fr_FR: "Trier par ordre alphabétique",
			pt_BR: "Ordenar alfabeticamente",
			ko_KR: "이름순 정렬",
			es_ES: "Ordenar alfabéticamente",
		},
	},
	table: {
		time: {
			zh_CN: "物品发布顺序表",
			zh_TW: "物品發布順序表",
			en_US: "Release order table",
			ja_JP: "アイテム追加順テーブル",
			fr_FR: "Ordre de sortie des objets",
			pt_BR: "Ordem de lançamento dos itens",
			ko_KR: "아이템 출시 순서",
			es_ES: "Orden de aparición de objetos",
		},
		time_desc: {
			zh_CN: "根据物品的发布版本为排序依据，出现早的物品更靠前",
			zh_TW: "依據物品發布版本排序，較早的物品排在前面",
			en_US: "Sort by item release version, earlier items first",
			ja_JP: "追加バージョン順で並び替え（古いものが前）",
			fr_FR: "Tri par version de sortie, les plus anciens en premier",
			pt_BR: "Ordena pela versão de lançamento, mais antigos primeiro",
			ko_KR: "출시 버전 기준 정렬 (오래된 순)",
			es_ES: "Ordenar por versión de aparición (los más antiguos primero)",
		},
		group: {
			zh_CN: "物品分类顺序表",
			zh_TW: "物品分類順序表",
			en_US: "Item category table",
			ja_JP: "カテゴリ別テーブル",
			fr_FR: "Table des catégories d'objets",
			pt_BR: "Tabela de categorias de itens",
			ko_KR: "아이템 분류 테이블",
			es_ES: "Tabla de categorías de objetos",
		},
		group_desc: {
			zh_CN: "根据物品作用分类后的id表，如武器和装备、工具、食物、作物",
			zh_TW: "依據物品用途分類，如武器、工具、食物等",
			en_US: "Categorized by item function (weapons, tools, food, etc.)",
			ja_JP: "用途別分類（武器・ツール・食料など）",
			fr_FR: "Classé par fonction (armes, outils, nourriture...)",
			pt_BR: "Classificado por função (armas, ferramentas, comida...)",
			ko_KR: "아이템 기능별 분류 (무기, 도구, 음식 등)",
			es_ES: "Clasificado por función (armas, herramientas, comida...)",
		},
	},
});

export const UserSettingLang = defineLangTree({
	title: {
		zh_CN: "自动整理设置",
		zh_TW: "自動整理設定",
		en_US: "Sorter Settings",
		ja_JP: "整理設定",
		fr_FR: "Paramètres de tri",
		pt_BR: "Configurações do organizador",
		ko_KR: "정리 설정",
		es_ES: "Configuración del organizador",
	},
	methods: {
		zh_CN: "整理方法",
		zh_TW: "整理方式",
		en_US: "Sorting method",
		ja_JP: "整理方法",
		fr_FR: "Méthode de tri",
		pt_BR: "Método de organização",
		ko_KR: "정렬 방식",
		es_ES: "Método de ordenación",
	},
	table: {
		zh_CN: "排序表",
		zh_TW: "排序表",
		en_US: "Sorting table",
		ja_JP: "ソートテーブル",
		fr_FR: "Table de tri",
		pt_BR: "Tabela de ordenação",
		ko_KR: "정렬 테이블",
		es_ES: "Tabla de ordenación",
	},
	table_tip: {
		zh_CN: "自定义排序依据(仅在按ID表顺序整理时有效)",
		zh_TW: "自訂排序依據（僅限ID表排序）",
		en_US: "Custom sorting (only for ID table mode)",
		ja_JP: "カスタム並び替え（IDテーブル時のみ有効）",
		fr_FR: "Tri personnalisé (mode ID uniquement)",
		pt_BR: "Ordenação personalizada (apenas modo ID)",
		ko_KR: "사용자 정의 정렬 (ID 모드 전용)",
		es_ES: "Orden personalizado (solo modo ID)",
	},
	dir: {
		zh_CN: "整理方向",
		zh_TW: "整理方向",
		en_US: "Sorting direction",
		ja_JP: "並び方向",
		fr_FR: "Direction de tri",
		pt_BR: "Direção",
		ko_KR: "정렬 방향",
		es_ES: "Dirección",
	},
	auto: {
		zh_CN: "自动整理容器",
		zh_TW: "自動整理容器",
		en_US: "Auto-sort containers",
		ja_JP: "コンテナ自動整理",
		fr_FR: "Tri automatique des conteneurs",
		pt_BR: "Organizar contêiner automaticamente",
		ko_KR: "컨테이너 자동 정리",
		es_ES: "Ordenar contenedores automáticamente",
	},
	auto_back: {
		zh_CN: "自动整理背包(定时整理)",
		zh_TW: "自動整理背包（定時）",
		en_US: "Auto-sort backpack (interval)",
		ja_JP: "インベントリ自動整理（定期）",
		fr_FR: "Tri auto du sac (intervalle)",
		pt_BR: "Organizar mochila automaticamente (intervalo)",
		ko_KR: "가방 자동 정리 (주기)",
		es_ES: "Ordenar mochila automáticamente (intervalo)",
	},
});

export const GlobalConfigLang = defineLangTree({
	title: {
		zh_CN: "全局设置",
		zh_TW: "全域設定",
		en_US: "Global Settings",
		ja_JP: "グローバル設定",
		fr_FR: "Paramètres globaux",
		pt_BR: "Configurações globais",
		ko_KR: "전역 설정",
		es_ES: "Configuración global",
	},
	skipBundle: {
		zh_CN: "跳过收纳袋",
		zh_TW: "跳過收納袋",
		en_US: "Skip bundles",
		ja_JP: "バンドルをスキップ",
		fr_FR: "Ignorer les sacs",
		pt_BR: "Ignorar bolsas",
		ko_KR: "번들 무시",
		es_ES: "Omitir bolsas",
	},
	skipBundle_tip: {
		zh_CN: "跳过收纳袋有助于显著降低卡顿",
		zh_TW: "跳過收納袋可降低卡頓",
		en_US: "Skipping bundles improves performance",
		ja_JP: "バンドルをスキップすると軽量化",
		fr_FR: "Ignorer les sacs améliore les performances",
		pt_BR: "Ignorar bolsas melhora o desempenho",
		ko_KR: "번들을 건너뛰면 성능 향상",
		es_ES: "Omitir bolsas mejora el rendimiento",
	},
	skipShulkerBox: {
		zh_CN: "跳过潜影盒",
		zh_TW: "跳過潛影盒",
		en_US: "Skip shulker boxes",
		ja_JP: "シュルカーボックスをスキップ",
		fr_FR: "Ignorer les shulker box",
		pt_BR: "Ignorar shulker boxes",
		ko_KR: "셜커 상자 무시",
		es_ES: "Omitir cajas shulker",
	},
	skipShulkerBox_tip: {
		zh_CN: "跳过潜影盒有助于降低卡顿",
		zh_TW: "跳過潛影盒可降低卡頓",
		en_US: "Skipping shulker boxes improves performance",
		ja_JP: "スキップで軽量化",
		fr_FR: "Améliore les performances",
		pt_BR: "Melhora o desempenho",
		ko_KR: "성능 향상",
		es_ES: "Mejora el rendimiento",
	},
	interval: {
		zh_CN: "背包自动整理间隔(秒)",
		zh_TW: "背包自動整理間隔（秒）",
		en_US: "Auto-sort interval (s)",
		ja_JP: "整理間隔（秒）",
		fr_FR: "Intervalle (s)",
		pt_BR: "Intervalo (s)",
		ko_KR: "간격(초)",
		es_ES: "Intervalo (s)",
	},
	cooldown: {
		zh_CN: "背包操作冷却(秒)",
		zh_TW: "背包操作冷卻（秒）",
		en_US: "Cooldown (s)",
		ja_JP: "クールダウン（秒）",
		fr_FR: "Temps de recharge (s)",
		pt_BR: "Tempo de recarga (s)",
		ko_KR: "쿨타임(초)",
		es_ES: "Tiempo de espera (s)",
	},
	cooldown_tip: {
		zh_CN: "设置玩家操作后背包自动整理冷却时间",
		zh_TW: "設定玩家操作後的冷卻時間",
		en_US: "Delay after player actions",
		ja_JP: "操作後の待機時間",
		fr_FR: "Délai après action",
		pt_BR: "Atraso após ação",
		ko_KR: "행동 후 지연",
		es_ES: "Retraso tras acción",
	},
	interval_tip: {
		zh_CN: "设置背包自动整理触发的时间间隔",
		zh_TW: "設定觸發間隔",
		en_US: "Interval between auto-sorts",
		ja_JP: "自動整理の間隔",
		fr_FR: "Intervalle de tri",
		pt_BR: "Intervalo de organização",
		ko_KR: "자동 정리 간격",
		es_ES: "Intervalo de ordenación",
	},
	loadMessage: {
		zh_CN: "显示加载成功消息",
		zh_TW: "顯示載入成功訊息",
		en_US: "Show load success message",
		ja_JP: "読み込み成功メッセージを表示",
		fr_FR: "Afficher le message de chargement réussi",
		pt_BR: "Exibir mensagem de carregamento concluído",
		ko_KR: "로드 성공 메시지 표시",
		es_ES: "Mostrar mensaje de carga completada",
	},
	saved: {
		zh_CN: "全局配置已保存",
		zh_TW: "全域設定已保存",
		en_US: "Global settings saved",
		ja_JP: "保存しました",
		fr_FR: "Enregistré",
		pt_BR: "Salvo",
		ko_KR: "저장됨",
		es_ES: "Guardado",
	},
});

export const MenuLang = defineLangTree({
	title: {
		zh_CN: "自动整理菜单",
		zh_TW: "自動整理選單",
		en_US: "Sorter Menu",
		ja_JP: "整理メニュー",
		fr_FR: "Menu de tri",
		pt_BR: "Menu do organizador",
		ko_KR: "정리 메뉴",
		es_ES: "Menú de organización",
	},
	userConfig: {
		zh_CN: "自动整理配置",
		zh_TW: "自動整理設定",
		en_US: "User Settings",
		ja_JP: "ユーザー設定",
		fr_FR: "Paramètres utilisateur",
		pt_BR: "Configurações do usuário",
		ko_KR: "사용자 설정",
		es_ES: "Configuración de usuario",
	},
	adminConfig: {
		zh_CN: "管理员配置",
		zh_TW: "管理員設定",
		en_US: "Admin Settings",
		ja_JP: "管理者設定",
		fr_FR: "Paramètres admin",
		pt_BR: "Configurações admin",
		ko_KR: "관리자 설정",
		es_ES: "Configuración admin",
	},
	lang: {
		zh_CN: "语言设置",
		zh_TW: "語言設定",
		en_US: "Language",
		ja_JP: "言語設定",
		fr_FR: "Langue",
		pt_BR: "Idioma",
		ko_KR: "언어",
		es_ES: "Idioma",
	},
});

export const AboutFormLang = defineLangTree({
	title: {
		zh_CN: "关于",
		zh_TW: "關於",
		en_US: "About",
		ja_JP: "情報",
		fr_FR: "À propos",
		pt_BR: "Sobre",
		ko_KR: "정보",
		es_ES: "Acerca de",
	},

	content: {
		zh_CN: "自动整理 v{version}\n作者：{author}\nQQ交流群：{group}",
		zh_TW: "自動整理 v{version}\n作者：{author}\nQQ群：{group}",
		en_US: "Sorter v{version}\nAuthor: {author}\nQQ Group: {group}",
		ja_JP: "自動整理 v{version}\n作者：{author}\nQQグループ：{group}",
		fr_FR: "Tri Auto v{version}\nAuteur : {author}\nGroupe QQ : {group}",
		pt_BR: "Organizador v{version}\nAutor: {author}\nGrupo QQ: {group}",
		ko_KR: "자동 정리 v{version}\n작성자: {author}\nQQ 그룹: {group}",
		es_ES: "Organizador v{version}\nAutor: {author}\nGrupo QQ: {group}",
	},

	changeLog: {
		zh_CN: `
v1.4.1(支持26.30+)
1. 支持新版本物品
2. 优化分类整理表
3. 添加加载提示配置项

v1.4.0（支持 26.10+）
1. 支持语言切换功能
2. 金蒲公英加入 ID 表
3. 支持跳过潜影盒及收纳袋
4. 优化自动整理调度逻辑
5. 添加性能统计功能
6. 优化自动整理性能
`,

		en_US: `
v1.4.1 (Supports 26.30+)
1. Added support for new version items
2. Optimized the classification sorting table
3. Added loading notification configuration option

v1.4.0 (Supports 26.10+)
1. Added language switching support
2. Added Torchflower to ID table
3. Added option to skip shulker boxes and bundles
4. Improved auto-sort scheduling logic
5. Added performance statistics feature
6. Optimized automatic sorting performance
`,
	},
});

export const ProfileFormLang = defineLangTree({
	title: {
		zh_CN: "性能统计",
		zh_TW: "效能統計",
		en_US: "Performance Stats",
		ja_JP: "パフォーマンス統計",
		fr_FR: "Statistiques de performance",
		pt_BR: "Estatísticas de desempenho",
		ko_KR: "성능 통계",
		es_ES: "Estadísticas de rendimiento",
	},

	empty: {
		zh_CN: "暂无统计数据",
		zh_TW: "暫無統計資料",
		en_US: "No data available",
		ja_JP: "データがありません",
		fr_FR: "Aucune donnée disponible",
		pt_BR: "Nenhum dado disponível",
		ko_KR: "데이터 없음",
		es_ES: "No hay datos disponibles",
	},

	global: {
		zh_CN: "全局统计\n平均耗时: {avg} ms\n总整理次数: {total}",
		zh_TW: "全域統計\n平均耗時: {avg} ms\n總整理次數: {total}",
		en_US: "Global Stats\nAvg Time: {avg} ms\nTotal Sorts: {total}",
		ja_JP: "全体統計\n平均時間: {avg} ms\n総整理回数: {total}",
		fr_FR: "Statistiques globales\nTemps moyen : {avg} ms\nTotal : {total}",
		pt_BR: "Estatísticas globais\nTempo médio: {avg} ms\nTotal: {total}",
		ko_KR: "전체 통계\n평균 시간: {avg} ms\n총 정리 횟수: {total}",
		es_ES: "Estadísticas globales\nTiempo medio: {avg} ms\nTotal: {total}",
	},

	player: {
		zh_CN: "你的统计\n平均耗时: {avg} ms",
		zh_TW: "你的統計\n平均耗時: {avg} ms",
		en_US: "Your Stats\nAvg Time: {avg} ms",
		ja_JP: "あなたの統計\n平均時間: {avg} ms",
		fr_FR: "Vos statistiques\nTemps moyen : {avg} ms",
		pt_BR: "Suas estatísticas\nTempo médio: {avg} ms",
		ko_KR: "내 통계\n평균 시간: {avg} ms",
		es_ES: "Tus estadísticas\nTiempo medio: {avg} ms",
	},

	slowest: {
		zh_CN: "最慢玩家（平均）\n玩家: {player}\n平均耗时: {avg} ms",
		zh_TW: "最慢玩家（平均）\n玩家: {player}\n平均耗時: {avg} ms",
		en_US: "Slowest Player (Avg)\nPlayer: {player}\nAvg Time: {avg} ms",
		ja_JP: "最も遅いプレイヤー（平均）\nプレイヤー: {player}\n平均時間: {avg} ms",
		fr_FR: "Joueur le plus lent (moyenne)\nJoueur : {player}\nTemps moyen : {avg} ms",
		pt_BR: "Jogador mais lento (média)\nJogador: {player}\nTempo médio: {avg} ms",
		ko_KR: "가장 느린 플레이어 (평균)\n플레이어: {player}\n평균 시간: {avg} ms",
		es_ES: "Jugador más lento (media)\nJugador: {player}\nTiempo medio: {avg} ms",
	},

	maxSingle: {
		zh_CN: "单次最慢\n玩家: {player}\n耗时: {duration} ms",
		zh_TW: "單次最慢\n玩家: {player}\n耗時: {duration} ms",
		en_US: "Max Single\nPlayer: {player}\nTime: {duration} ms",
		ja_JP: "単発最大\nプレイヤー: {player}\n時間: {duration} ms",
		fr_FR: "Plus long (une fois)\nJoueur : {player}\nTemps : {duration} ms",
		pt_BR: "Maior tempo único\nJogador: {player}\nTempo: {duration} ms",
		ko_KR: "단일 최대\n플레이어: {player}\n시간: {duration} ms",
		es_ES: "Máximo individual\nJugador: {player}\nTiempo: {duration} ms",
	},
});
