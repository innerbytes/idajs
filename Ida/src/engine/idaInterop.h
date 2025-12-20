#pragma once

// IMPORTANT !!! This is an exact copy of LBA2 game types for the interoperability !!!
// !!! No changes here can be made without changes to corresponfing definitions in LBA2 H files, specified below, and
// other way around!!!

// TODO - consider making common defines that are reused in LBA2 files and in Ida ? Or generate this file

#include "..\..\SOURCES\cfg-defines.h"

#pragma pack(push, 1)

// ************************ ADELINE.H  *************************************************
extern "C" {

// ──────────────────────────────────────────────────────────────────────────
typedef unsigned char U8;
typedef signed char S8;
typedef unsigned short U16;
typedef signed short S16;
typedef unsigned long U32;
typedef signed long S32;

typedef struct
{
    U32 Low;
    U32 High;
} U64;

typedef struct
{
    U32 Low;
    S32 High;
} S64;

typedef void(VOID_FUNC)();

typedef U64 *PTR_U64;
typedef S64 *PTR_S64;
typedef U32 *PTR_U32;
typedef S32 *PTR_S32;
typedef U16 *PTR_U16;
typedef S16 *PTR_S16;
typedef U8 *PTR_U8;
typedef S8 *PTR_S8;

#define AND &&
#define OR ||

// ──────────────────────────────────────────────────────────────────────────
#define TRUE 1
#define FALSE 0
}

/// *********************** AFF_OBJ.H **************************************

extern "C" {

//                ***************
//                *** EQUATES ***
//                ***************

#define TYPE_ROTATE 0
#define TYPE_TRANSLATE 1

//                ******************
//                *** STRUCTURES ***
//                ******************

//****************************************************************************

//****************************************************************************
typedef struct
{
    S16 Type;
    S16 Alpha;
    S16 Beta;
    S16 Gamma;

} T_GROUP_INFO;

typedef union
{
    void *Ptr;
    S32 Num;

} T_PTR_NUM;

typedef struct
{
    S32 X;  // world coor
    S32 Y;
    S32 Z;

    S32 Alpha;  // local angles
    S32 Beta;
    S32 Gamma;

    T_PTR_NUM Body;
    ;  // ->.O3D
    T_PTR_NUM NextBody;
    ;                // ->.O3D
    T_PTR_NUM Anim;  // ->.A3D

    void *Texture;      //
    void *NextTexture;  //

    U32 LastOfsIsPtr;

    S32 LastFrame;
    U32 LastOfsFrame;
    U32 LastTimer;  // last TimerRef
    U32 LastNbGroups;

    S32 NextFrame;
    U32 NextOfsFrame;
    U32 NextTimer;  // TimerRef when frame reached
    U32 NextNbGroups;

    S32 LoopFrame;
    U32 LoopOfsFrame;

    U32 NbFrames;

    S32 LastAnimStepX;
    S32 LastAnimStepY;
    S32 LastAnimStepZ;

    S32 LastAnimStepAlpha;
    S32 LastAnimStepBeta;
    S32 LastAnimStepGamma;

    U32 Interpolator;  // lib internal

    U32 Time;  // TimerRef last modif

    U32 Status;  // BitField FLAG_*

    U32 Master;  // BitField ANIM_MASTER_ROT

    U32 NbGroups;

    T_GROUP_INFO CurrentFrame[30];

} T_OBJ_3D;

//****************************************************************************
typedef struct
{
    S16 X;
    S16 Y;
    S16 Z;
    S16 Group;

} T_OBJ_POINT;

//****************************************************************************

typedef struct
{
    S32 Info;
    S16 SizeHeader;
    S16 Dummy;
    S32 XMin;
    S32 XMax;
    S32 YMin;
    S32 YMax;
    S32 ZMin;
    S32 ZMax;
    S32 NbGroupes;
    S32 OffGroupes;
    S32 NbPoints;
    S32 OffPoints;
    S32 NbNormales;
    S32 OffNormales;
    S32 NbNormFaces;
    S32 OffNormFaces;
    S32 NbPolys;
    S32 OffPolys;
    S32 NbLines;
    S32 OffLines;
    S32 NbSpheres;
    S32 OffSpheres;
    S32 NbTextures;
    S32 OffTextures;
} T_BODY_HEADER;
}

/// *********************** MOVE.H *****************************************

#pragma pack(push, 4)

//---------------------------------------------------------------------------
typedef struct
{
    S32 Speed;
    S32 Acc;
    U32 LastTimer;
} MOVE;

//---------------------------------------------------------------------------
typedef struct
{
    MOVE Move;
    S32 Cur;
    S32 End;
} BOUND_MOVE;

//---------------------------------------------------------------------------
#pragma pack(pop)

/// *********************** COMMON.H ***************************************

#define NUM_PERSO ((U8)0)
#define COUL_PERSO 12  // Couleur de dialogue de Twinsen

#define NUM_ZOE ((U8)7)  // Numero de personnage scenarique
#define COUL_ZOE 4       // Couleur de dialogue de Zoe

#define COUL_CINEMA 0  // Couleur des bandes cinema

#define MECA_PINGOUIN_DISTANCE 700
#define NUM_PINGOUIN 1

#define ACTIVE_LIFE 0
#define ACTIVE_TRACK 1

#define MAX_TYPES_ZONE 10

#define POS_MIDDLE 1
#define POS_LEFT 2
#define POS_RIGHT 4
#define POS_UP 8
#define POS_DOWN 16

/* work flags */

#define WAIT_HIT_FRAME (1 << 0)
#define OK_HIT (1 << 1)
#define ANIM_END (1 << 2)
#define NEW_FRAME (1 << 3)

#define WAS_DRAWN (1 << 4)

#define OBJ_DEAD (1 << 5)
#define AUTO_STOP_DOOR (1 << 6)

#define ANIM_MASTER_ROT (1 << 7)

#define FALLING (1 << 8)

#define OK_SUPER_HIT (1 << 9)
#define FRAME_SHIELD (1 << 10)

#define DRAW_SHADOW (1 << 11)
#define ANIM_MASTER_GRAVITY (1 << 12)

#define SKATING \
    (1 << 13)  // Ouch! je glisse dans une collision
               // interdite

#define OK_RENVOIE (1 << 14)  // prêt à renvoyer un projectile

#define LEFT_JUMP (1 << 15)           // prêt à sauter du pied gauche
#define RIGHT_JUMP (1 << 16)          // prêt à sauter du pied droit
#define WAIT_SUPER_HIT (1 << 17)      // attend la fin de l'anim avant de redonner un super_hit
#define TRACK_MASTER_ROT (1 << 18)    // c'est le track qui gere la direction
#define FLY_JETPACK (1 << 19)         // en train de voler avec le Jetpack
#define DONT_PICK_CODE_JEU (1 << 20)  // Magouille Zones Tapis Roulant
#define MANUAL_INTER_FRAME (1 << 21)  // Fait le ObjectSetInterFrame() manuellement
#define WAIT_COORD (1 << 22)          // attend d'avoir été affiché pour passer les coordonnées d'1 point à 1 extra
#define CHECK_FALLING (1 << 23)       // force objet à tester le FALLING pdt une frame

/* Flags */

#define CHECK_OBJ_COL (1 << 0)    // test des collisions et hit obj
#define CHECK_BRICK_COL (1 << 1)  // test des collisions decors
#define CHECK_ZONE (1 << 2)       // test des zones scenariques
#define SPRITE_CLIP (1 << 3)      // (portes) zone de clip fixe
#define PUSHABLE (1 << 4)         // poussable
#define COL_BASSE (1 << 5)        // 1 = pas test des collisions hautes TWINSEN

#define CHECK_CODE_JEU (1 << 6)    // test la noyade
#define CHECK_ONLY_FLOOR (1 << 7)  // test uniquement les collisions au sol

#define INVISIBLE (1 << 9)  // not drawn but all computed

#define SPRITE_3D (1 << 10)  // un sprite pas un 3DO

#define OBJ_FALLABLE (1 << 11)    // peut tomber
#define NO_SHADOW (1 << 12)       // pas d'ombre auto
#define OBJ_BACKGROUND (1 << 13)  // s'incruste dans le decor la 1er fois

#define OBJ_CARRIER (1 << 14)  // peut porter et deplacer un obj

#define MINI_ZV (1 << 15)       // zv carre sur plus petit cote (si 3DO)
#define POS_INVALIDE (1 << 16)  // Carrier considéré comme Pos invalide
#define NO_CHOC (1 << 17)       // Ne déclenche pas d'anim choc
#define ANIM_3DS (1 << 18)      // Animation 3DS (extension de sprite_3D)
#define NO_PRE_CLIP (1 << 19)   // Ne préclippe pas l'objet (pour les grands objets)
#define OBJ_ZBUFFER (1 << 20)   // Affiche objet en ZBuffer (extérieur only !)
#define OBJ_IN_WATER (1 << 21)  // Affiche objet en ZBuffer dans l'eau (extérieur only !)

/* Option Flags */
#define EXTRA_MASK (16 + 32 + 64 + 128 + 256)

#define EXTRA_GIVE_NOTHING 1

#define EXTRA_GIVE_MONEY 16
#define EXTRA_GIVE_LIFE 32
#define EXTRA_GIVE_MAGIC 64
#define EXTRA_GIVE_KEY 128
#define EXTRA_GIVE_CLOVER 256

/* FlagAnim */

#define ANIM_REPEAT 0    // anim par defaut + anims scenariques
#define ANIM_THEN 1      // anim jouee une fois et interruptible
#define ANIM_ALL_THEN 2  // anim forcee jouee 1 fois et ininterruptible
#define ANIM_TEMPO 3     // anim jouee en repeat temporairement
#define ANIM_FINAL 4     // anim forcee ininterruptible de mort

// FlagClimbing
#define CLIMBING_UP 1
#define CLIMBING_DOWN 2

#define TEMPO_PROTO_AUTO 500

/*---------------- Track: macros ------------------*/

#define TM_END 0
#define TM_NOP 1
#define TM_BODY 2
#define TM_ANIM 3
#define TM_GOTO_POINT 4
#define TM_WAIT_ANIM 5
#define TM_LOOP 6
#define TM_ANGLE 7
#define TM_POS_POINT 8
#define TM_LABEL 9
#define TM_GOTO 10
#define TM_STOP 11
#define TM_GOTO_SYM_POINT 12
#define TM_WAIT_NB_ANIM 13
#define TM_SAMPLE 14
#define TM_GOTO_POINT_3D 15
#define TM_SPEED 16
#define TM_BACKGROUND 17
#define TM_WAIT_NB_SECOND 18
#define TM_NO_BODY 19
#define TM_BETA 20
#define TM_OPEN_LEFT 21
#define TM_OPEN_RIGHT 22
#define TM_OPEN_UP 23
#define TM_OPEN_DOWN 24
#define TM_CLOSE 25
#define TM_WAIT_DOOR 26
#define TM_SAMPLE_RND 27
#define TM_SAMPLE_ALWAYS 28
#define TM_SAMPLE_STOP 29
#define TM_PLAY_ACF 30
#define TM_REPEAT_SAMPLE 31
#define TM_SIMPLE_SAMPLE 32
#define TM_FACE_TWINSEN 33
#define TM_ANGLE_RND 34
#define TM_REM 35
#define TM_WAIT_NB_DIZIEME 36
#define TM_DO 37
#define TM_SPRITE 38
#define TM_WAIT_NB_SECOND_RND 39
#define TM_AFF_TIMER 40
#define TM_SET_FRAME 41
#define TM_SET_FRAME_3DS 42
#define TM_SET_START_3DS 43
#define TM_SET_END_3DS 44
#define TM_START_ANIM_3DS 45
#define TM_STOP_ANIM_3DS 46
#define TM_WAIT_ANIM_3DS 47
#define TM_WAIT_FRAME_3DS 48
#define TM_WAIT_NB_DIZIEME_RND 49
#define TM_DECALAGE 50
#define TM_FREQUENCE 51
#define TM_VOLUME 52

#define NB_MACROS_TRACK 53

/* Life: macro */
#define LM_END 0
#define LM_NOP 1
#define LM_SNIF 2
#define LM_OFFSET 3
#define LM_NEVERIF 4

#define LM_PALETTE 10
#define LM_RETURN 11
#define LM_IF 12
#define LM_SWIF 13
#define LM_ONEIF 14
#define LM_ELSE 15
#define LM_ENDIF 16
#define LM_BODY 17
#define LM_BODY_OBJ 18
#define LM_ANIM 19
#define LM_ANIM_OBJ 20
#define LM_SET_CAMERA 21
#define LM_CAMERA_CENTER 22
#define LM_SET_TRACK 23
#define LM_SET_TRACK_OBJ 24
#define LM_MESSAGE 25
#define LM_FALLABLE 26
#define LM_SET_CONTROL 27
#define LM_SET_CONTROL_OBJ 28
#define LM_CAM_FOLLOW 29
#define LM_COMPORTEMENT_HERO 30
#define LM_SET_VAR_CUBE 31
#define LM_COMPORTEMENT 32
#define LM_SET_COMPORTEMENT 33
#define LM_SET_COMPORTEMENT_OBJ 34
#define LM_END_COMPORTEMENT 35
#define LM_SET_VAR_GAME 36
#define LM_KILL_OBJ 37
#define LM_SUICIDE 38
#define LM_USE_ONE_LITTLE_KEY 39
#define LM_GIVE_GOLD_PIECES 40
#define LM_END_LIFE 41
#define LM_STOP_L_TRACK 42
#define LM_RESTORE_L_TRACK 43
#define LM_MESSAGE_OBJ 44
#define LM_INC_CHAPTER 45
#define LM_FOUND_OBJECT 46
#define LM_SET_DOOR_LEFT 47
#define LM_SET_DOOR_RIGHT 48
#define LM_SET_DOOR_UP 49
#define LM_SET_DOOR_DOWN 50
#define LM_GIVE_BONUS 51
#define LM_CHANGE_CUBE 52
#define LM_OBJ_COL 53
#define LM_BRICK_COL 54
#define LM_OR_IF 55
#define LM_INVISIBLE 56
#define LM_SHADOW_OBJ 57
#define LM_POS_POINT 58
#define LM_SET_MAGIC_LEVEL 59
#define LM_SUB_MAGIC_POINT 60
#define LM_SET_LIFE_POINT_OBJ 61
#define LM_SUB_LIFE_POINT_OBJ 62
#define LM_HIT_OBJ 63
#define LM_PLAY_ACF 64
#define LM_ECLAIR 65
#define LM_INC_CLOVER_BOX 66
#define LM_SET_USED_INVENTORY 67
#define LM_ADD_CHOICE 68
#define LM_ASK_CHOICE 69
#define LM_INIT_BUGGY 70
#define LM_MEMO_ARDOISE 71
#define LM_SET_HOLO_POS 72
#define LM_CLR_HOLO_POS 73
#define LM_ADD_FUEL 74
#define LM_SUB_FUEL 75
#define LM_SET_GRM 76
#define LM_SET_CHANGE_CUBE 77
#define LM_MESSAGE_ZOE 78
#define LM_FULL_POINT 79
#define LM_BETA 80
#define LM_FADE_TO_PAL 81
#define LM_ACTION 82
#define LM_SET_FRAME 83
#define LM_SET_SPRITE 84
#define LM_SET_FRAME_3DS 85
#define LM_IMPACT_OBJ 86
#define LM_IMPACT_POINT 87
#define LM_ADD_MESSAGE 88
#define LM_BULLE 89  // remplace BULLE_ON
#define LM_NO_CHOC 90
#define LM_ASK_CHOICE_OBJ 91
#define LM_CINEMA_MODE 92
#define LM_SAVE_HERO 93
#define LM_RESTORE_HERO 94
#define LM_ANIM_SET 95
#define LM_PLUIE 96
#define LM_GAME_OVER 97
#define LM_THE_END 98
#define LM_ESCALATOR 99
#define LM_PLAY_MUSIC 100
#define LM_TRACK_TO_VAR_GAME 101
#define LM_VAR_GAME_TO_TRACK 102
#define LM_ANIM_TEXTURE 103
#define LM_ADD_MESSAGE_OBJ 104
#define LM_BRUTAL_EXIT 105
#define LM_REM 106
#define LM_ECHELLE 107
#define LM_SET_ARMURE 108
#define LM_SET_ARMURE_OBJ 109
#define LM_ADD_LIFE_POINT_OBJ 110
#define LM_STATE_INVENTORY 111
#define LM_AND_IF 112
#define LM_SWITCH 113
#define LM_OR_CASE 114
#define LM_CASE 115
#define LM_DEFAULT 116
#define LM_BREAK 117
#define LM_END_SWITCH 118
#define LM_SET_HIT_ZONE 119
#define LM_SAVE_COMPORTEMENT 120
#define LM_RESTORE_COMPORTEMENT 121
#define LM_SAMPLE 122
#define LM_SAMPLE_RND 123
#define LM_SAMPLE_ALWAYS 124
#define LM_SAMPLE_STOP 125
#define LM_REPEAT_SAMPLE 126
#define LM_BACKGROUND 127
#define LM_ADD_VAR_GAME 128
#define LM_SUB_VAR_GAME 129
#define LM_ADD_VAR_CUBE 130
#define LM_SUB_VAR_CUBE 131
// #define LM_NOP      			132
#define LM_SET_RAIL 133
#define LM_INVERSE_BETA 134
#define LM_NO_BODY 135
#define LM_ADD_GOLD_PIECES 136
#define LM_STOP_L_TRACK_OBJ 137
#define LM_RESTORE_L_TRACK_OBJ 138
#define LM_SAVE_COMPORTEMENT_OBJ 139
#define LM_RESTORE_COMPORTEMENT_OBJ 140
#define LM_SPY 141
#define LM_DEBUG 142
#define LM_DEBUG_OBJ 143
#define LM_POPCORN 144
#define LM_FLOW_POINT 145
#define LM_FLOW_OBJ 146
#define LM_SET_ANIM_DIAL 147
#define LM_PCX 148
#define LM_END_MESSAGE 149
#define LM_END_MESSAGE_OBJ 150
#define LM_PARM_SAMPLE 151
#define LM_NEW_SAMPLE 152
#define LM_POS_OBJ_AROUND 153
#define LM_PCX_MESS_OBJ 154

#define NB_MACROS_LIFE 155

/*---*/
#define LF_COL 0
#define LF_COL_OBJ 1
#define LF_DISTANCE 2
#define LF_ZONE 3
#define LF_ZONE_OBJ 4
#define LF_BODY 5
#define LF_BODY_OBJ 6
#define LF_ANIM 7
#define LF_ANIM_OBJ 8
#define LF_L_TRACK 9
#define LF_L_TRACK_OBJ 10
#define LF_VAR_CUBE 11
#define LF_CONE_VIEW 12
#define LF_HIT_BY 13
#define LF_ACTION 14
#define LF_VAR_GAME 15
#define LF_LIFE_POINT 16
#define LF_LIFE_POINT_OBJ 17
#define LF_NB_LITTLE_KEYS 18
#define LF_NB_GOLD_PIECES 19
#define LF_COMPORTEMENT_HERO 20
#define LF_CHAPTER 21
#define LF_DISTANCE_3D 22
#define LF_MAGIC_LEVEL 23
#define LF_MAGIC_POINT 24
#define LF_USE_INVENTORY 25
#define LF_CHOICE 26
#define LF_FUEL 27
#define LF_CARRY_BY 28
#define LF_CDROM 29
#define LF_ECHELLE 30
#define LF_RND 31
#define LF_RAIL 32
#define LF_BETA 33
#define LF_BETA_OBJ 34
#define LF_CARRY_OBJ_BY 35
#define LF_ANGLE 36
#define LF_DISTANCE_MESSAGE 37
#define LF_HIT_OBJ_BY 38
#define LF_REAL_ANGLE 39
#define LF_DEMO 40
#define LF_COL_DECORS 41
#define LF_COL_DECORS_OBJ 42
#define LF_PROCESSOR 43
#define LF_OBJECT_DISPLAYED 44
#define LF_ANGLE_OBJ 45

#define NB_FUNCS_LIFE 46

/*---*/
#define LT_EQUAL 0
#define LT_SUP 1
#define LT_LESS 2
#define LT_SUP_EQUAL 3
#define LT_LESS_EQUAL 4
#define LT_DIFFERENT 5

#define NB_TESTS_LIFE 6

/*---------------- VAR_GAME ------------------*/

//	Inventaire

#define FLAG_HOLOMAP 0
#define FLAG_BALLE_MAGIQUE 1
#define FLAG_DART 2  // Flechettes
#define FLAG_BOULE_SENDELL 3
#define FLAG_TUNIQUE 4
#define FLAG_PERLE 5
#define FLAG_CLEF_PYRAMID 6
#define FLAG_VOLANT 7
#define FLAG_MONEY 8       // Kashes ou Zlitos
#define FLAG_PISTOLASER 9  // PistoLaser
#define FLAG_SABRE 10      // Le Sabre
#define FLAG_GANT 11       // Gant
#define FLAG_PROTOPACK 12
#define FLAG_TICKET_FERRY 13
#define FLAG_MECA_PINGOUIN 14
#define FLAG_GAZOGEM 15  // GazoGem
#define FLAG_DEMI_MEDAILLON 16
#define FLAG_ACIDE_GALLIQUE 17
#define FLAG_CHANSON 18
#define FLAG_ANNEAU_FOUDRE 19
#define FLAG_PARAPLUIE 20
#define FLAG_GEMME 21
#define FLAG_CONQUE 22
#define FLAG_SARBACANE 23
#define FLAG_DISQUE_ROUTE 24  // Disque de Route
#define FLAG_VISIONNEUSE 24   // Visionneuse ACFs
#define FLAG_TART_LUCI 25
#define FLAG_RADIO 26
#define FLAG_FLEUR 27
#define FLAG_ARDOISE 28
#define FLAG_TRADUCTEUR 29
#define FLAG_DIPLOME 30
#define FLAG_DMKEY_KNARTA 31
#define FLAG_DMKEY_SUP 32
#define FLAG_DMKEY_MOSQUI 33
#define FLAG_DMKEY_BLAFARD 34
#define FLAG_CLE_REINE 35  // Clé Reine Mosquibies
#define FLAG_PIOCHE 36
#define FLAG_CLEF_BOURGMESTRE 37
#define FLAG_NOTE_BOURGMESTRE 38
#define FLAG_PROTECTION 39  // Sort de protection

// ATTENTION: Magouille car le scaphandre ne fait pas parti de l'inventaire
// donc on utilise un VAR_GAME scénarique
#define FLAG_SCAPHANDRE 40

#define FLAG_CELEBRATION 79
#define FLAG_DINO_VOYAGE 94

#define FLAG_ACF 235
#define FLAG_ACF2 236
#define FLAG_ACF3 237
#define FLAG_ESC 249
#define FLAG_CLOVER 251
#define FLAG_VEHICULE_PRIS 252
#define FLAG_CHAPTER 253
#define FLAG_PLANETE_ESMER 254
#define FLAG_DONT_USE 255  // Pour l'inventaire

/*──────────────────────────────────────────────────────────────────────────*/

#define NO_MOVE 0
#define MOVE_MANUAL 1
#define MOVE_FOLLOW 2
#define MOVE_TRACK 3
#define MOVE_TRACK_ATTACK 5
#define MOVE_SAME_XZ 6
#define MOVE_PINGOUIN 7
#define MOVE_WAGON 8
#define MOVE_CIRCLE 9    // Beta = Tangeante au cercle
#define MOVE_CIRCLE2 10  // Beta = face au drapeau
#define MOVE_SAME_XZ_BETA 11
#define MOVE_BUGGY 12
#define MOVE_BUGGY_MANUAL 13

/*──────────────────────────────────────────────────────────────────────────*/

typedef struct
{
    S32 X0;
    S32 Y0;
    S32 Z0;
    S32 X1;
    S32 Y1;
    S32 Z1;
    S32 Info0;
    S32 Info1;
    S32 Info2;
    S32 Info3;
    S32 Info4;  // Rajout de 4 champs infos le 08/12/95
    S32 Info5;
    S32 Info6;
    S32 Info7;

    S16 Type;
    S16 Num;
} T_ZONE;

/// *********************** DEFINES.H **************************************

#define MAX_ANGLE 4096
#define MUL_ANGLE 4

// Brick, Gri et Bll dans .HQR
#define BRICK_HQR 1
// samples dans .HQR
#define SAMPLE_HQR 1
// samples des FLAs dans .HQR
#define SAMPLE_FLA_HQR 1

#define WHITE 255
#define LBAWHITE 15
#define BLACK 0

/*---------------- CONSTANTE ------------------*/

#define SIZE_CUBE_X 64
#define SIZE_CUBE_Y 25
#define SIZE_CUBE_Z 64

#define SIZE_BRICK_XZ 512
#define SIZE_BRICK_Y 256
#define DEMI_BRICK_XZ 256
#define DEMI_BRICK_Y 128

/*---------------- FENETRE ------------------*/

#define VIEW_X0 -50
#define VIEW_Y0 -30
#define VIEW_X1 680
#define VIEW_Y1 580

/*──────────────────────────────────────────────────────────────────────────*/
/* type objet pour affscene */

#define TYPE_OBJ_3D (1024 * 0)
#define TYPE_FLAG_RED (1024 * 1)
#define TYPE_FLAG_YELLOW (1024 * 2)
#define TYPE_SHADOW (1024 * 3)
#define TYPE_OBJ_SPRITE (1024 * 4)
#define TYPE_ZONE_DEC (1024 * 5)
#define TYPE_EXTRA (1024 * 6)

/*──────────────────────────────────────────────────────────────────────────*/

#define MIN_S16 -32768
#define MAX_S16 32767

#define BODY_3D_PROTECT 62

/*──────────────────────────────────────────────────────────────────────────*/ /*──────────────────────────────────────────────────────────────────────────*/
#define NO_BODY 255

#define GEN_BODY_NORMAL 0
#define GEN_BODY_TUNIQUE 1
#define GEN_BODY_SABRE 2
#define GEN_BODY_SARBACANE 3
#define GEN_BODY_SARBATRON 4
#define GEN_BODY_GANT 5
#define GEN_BODY_PISTOLASER 6
#define GEN_BODY_MAGE 7
#define GEN_BODY_MAGE_SARBACANE 8
#define GEN_BODY_FEU 9
#define GEN_BODY_TUNIQUE_TIR 10
#define GEN_BODY_MAGE_TIR 11
#define GEN_BODY_LABYRINTHE 12

#define NO_ANIM 255

#define GEN_ANIM_RIEN 0
#define GEN_ANIM_MARCHE 1
#define GEN_ANIM_RECULE 2
#define GEN_ANIM_GAUCHE 3
#define GEN_ANIM_DROITE 4
#define GEN_ANIM_ENCAISSE 5
#define GEN_ANIM_CHOC 6
#define GEN_ANIM_TOMBE 7
#define GEN_ANIM_RECEPTION 8
#define GEN_ANIM_RECEPTION_2 9
#define GEN_ANIM_MORT 10
#define GEN_ANIM_ACTION 11
#define GEN_ANIM_MONTE 12
#define GEN_ANIM_ECHELLE 13
#define GEN_ANIM_SAUTE 14
#define GEN_ANIM_LANCE 15
#define GEN_ANIM_CACHE 16
#define GEN_ANIM_COUP_1 17
#define GEN_ANIM_COUP_2 18
#define GEN_ANIM_COUP_3 19
#define GEN_ANIM_TROUVE 20
#define GEN_ANIM_NOYADE 21
#define GEN_ANIM_CHOC2 22
#define GEN_ANIM_SABRE 23
#define GEN_ANIM_DEGAINE 24
#define GEN_ANIM_SAUTE_GAUCHE 25
#define GEN_ANIM_SAUTE_DROIT 26
#define GEN_ANIM_POUSSE 27
#define GEN_ANIM_PARLE 28
#define GEN_ANIM_DART 29
#define GEN_ANIM_DESCEND 30
#define GEN_ANIM_ECHDESC 31
#define GEN_ANIM_ARRIMAGE 32
#define GEN_ANIM_SKATE 33
#define GEN_ANIM_SKATEG 34
#define GEN_ANIM_SARBACANE 35
#define GEN_ANIM_GANT_DROIT 36
#define GEN_ANIM_GANT_GAUCHE 37
#define GEN_ANIM_PISTOLASER 38
#define GEN_ANIM_FOUDRE 39
#define GEN_ANIM_ESQUIVE_DROITE 40   // Esquive à droite
#define GEN_ANIM_ESQUIVE_GAUCHE 41   // Esquive à gauche
#define GEN_ANIM_ESQUIVE_AVANT 42    // Esquive avant
#define GEN_ANIM_ESQUIVE_ARRIERE 43  // Esquive arriere
#define GEN_ANIM_FEU 44
#define GEN_ANIM_SARBATRON 45
#define GEN_ANIM_GAZ 46
#define GEN_ANIM_LABYRINTHE 47  // Mort dans le labyrinthe du dôme

#define IMPACT_PINGOUIN 0  // index dans le HQR

/*──────────────────────────────────────────────────────────────────────────*/
//--------------- Types de sauts pour Twinsen ------------------------

#define DO_NORMAL_JUMP 1
#define DO_LEFT_JUMP 2
#define DO_RIGHT_JUMP 4

typedef struct
{
    U8 Func;
    U8 TypeAnswer;
    S16 Value;
} T_EXE_SWITCH;

/*──────────────────────────────────────────────────────────────────────────*/
/*──────────────────────────────────────────────────────────────────────────*/

// structure normalement alignée

typedef struct
{
    U8 GenBody;    // 0 à 254 mais je veux -1
    U8 Col;        /* brick en collision (inutile?) */
    S16 SizeSHit;  // Toujours carres

    U16 GenAnim;
    U16 NextGenAnim;

    S32 OldPosX; /* old pos world */
    S32 OldPosY;
    S32 OldPosZ;

    S32 Info; /* infos pour DoDir */
    S32 Info1;
    S32 Info2;
    S32 Info3;

    union
    {
        struct
        {
            S32 SHitX;
            S32 SHitY;  // Coups Super Hit
            S32 SHitZ;  // Servent aussi pour les Anim3DS
        } SHit;

        // ATTENTION: un PUSHABLE ne peut pas lancer de SUPER_HIT
        struct
        {
            S32 PushX;
            S32 PushY;
            S32 PushZ;
        } Push;

        struct
        {
            S32 Num;
            S32 Deb;
            S32 Fin;
        } A3DS;
    } Coord;

    /* B*/ U8 HitBy;      /* frappe par */
    /* B*/ U8 HitForce;   /* si !=0 force de frappe anim */
    /* B*/ S16 LifePoint; /* point de vie en cours */
    S16 OptionFlags;      /* flag d'init 2 */

    U8 *PtrAnimAction;

    S16 Sprite;
    S16 OffsetLabelTrack;

    // divers
    T_OBJ_3D Obj;

    U8 *PtrFile3D;
    S32 IndexFile3D;

    // constantes
    /* B*/ S16 NbBonus; /* nb bonus to give */
    /* B*/ U8 Armure;   /* resistance */
    U8 CoulObj;         /* couleur dominante de l'objet */

    /* game infos */
    S16 XMin; /* ZV */
    S16 XMax;
    S16 YMin;
    S16 YMax;
    S16 ZMin;
    S16 ZMax;

    S32 OldBeta; /* angle de la boucle precedente */

    BOUND_MOVE BoundAngle; /* valeur real time de rotation */

    U8 *PtrTrack;    /* ptr track prog */
    S16 OffsetTrack; /* offset dans la track */

    S16 SRot; /* vitesse de rotation */

    U8 *PtrLife;

    S16 OffsetLife; /* offset dans la vie */
    U16 AnimDial;   // se trouve ici pour l'alignement

    /* B*/ S16 CarryBy;
    /* B*/ U8 Move;   /* type de deplacement */
    /* B*/ U8 ObjCol; /* num obj en collision */

    S16 ZoneSce;                 /* zone declenchement scenarique */
    /* B*/ S16 LabelTrack;       /* dernier label de track */
    /* B*/ S16 MemoLabelTrack;   /* memo dernier label de track */
    /* B*/ S16 MemoComportement; /* memo comportement life */

    U32 Flags;     /* flags divers permanent */
                   //	U16	Flags2 ;		/* flags divers permanent */
    U32 WorkFlags; /* flags de gestion */

    S16 DoorWidth;  // pour les DOOR

    /* B*/ U8 FlagAnim; /* type d'anim en cours (dans flags?) */

    U8 CodeJeu;  // brick spéciale sample ou action

    T_EXE_SWITCH ExeSwitch;

    //	S16	MessageChapter[MAX_CHAPTER] ;

    T_ZONE *PtrZoneRail;

    S32 SampleAlways;  // Handle du sample always en train de se jouer
    U8 SampleVolume;
} T_OBJET;

typedef struct
{
    S32 X;
    S32 Y;
    S32 Z;
} T_TRACK;

typedef struct
{
    U8 Type;
    U8 Num;

} T_TABALLCUBE;

#pragma pack(pop)
