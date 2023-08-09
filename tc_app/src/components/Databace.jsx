import * as SQLite from "expo-sqlite";

// DB接続
exports.db = SQLite.openDatabase("db");

exports.CreateDB = function(props){
  
  return new Promise((resolve, reject)=>{
    
  module.exports.db.transaction((tx) => {
    
    // スタッフプロフィール　カラム追加
    // staff_photo4（バストアップ写真）
    tx.executeSql(
      `PRAGMA table_info('staff_profile');`,
      [],
      (_, { rows }) => {
        
        
        if(rows._array.length == 7) {
          
          tx.executeSql(
            `alter table "staff_profile" add column "staff_photo4" text;`,
            [],
            () => {console.log("staff_photo4追加");},
            (e) => {console.log("staff_photo4失敗");}
          );
          
        }
      },
      () => {
        console.log("スタッフテーブル　カラム追加失敗");
        
      }
    );
    
    // スタッフテーブル　カラム追加
    // メール表示名、個人メールアドレス1～3、設定2-4(top_staff_list)、設定2-7(setting_list7_mail)
    // 20220511 fc_flg 追加
    tx.executeSql(
      `PRAGMA table_info('staff_mst');`,
      [],
      (_, { rows }) => {
        
        
        if(rows._array.length == 17) {
          
          tx.executeSql(
            `alter table "staff_mst" add column "line_id" text;`,
            [],
            () => {console.log("LINEid追加");},
            (e) => {console.log("LINEid失敗");}
          );
          
          tx.executeSql(
            `alter table "staff_mst" add column "mail_name" text;`,
            [],
            () => {console.log("メール表示名追加");},
            (e) => {console.log("メール表示名失敗");}
          );
          
          tx.executeSql(
            `alter table "staff_mst" add column "mail1" text;`,
            [],
            () => {console.log("個人メールアドレス1追加");},
            (e) => {console.log("個人メールアドレス1失敗");}
          );
          
          tx.executeSql(
            `alter table "staff_mst" add column "mail2" text;`,
            [],
            () => {console.log("個人メールアドレス2追加");},
            (e) => {console.log("個人メールアドレス2失敗");}
          );
          
          tx.executeSql(
            `alter table "staff_mst" add column "mail3" text;`,
            [],
            () => {console.log("個人メールアドレス3追加");},
            (e) => {console.log("個人メールアドレス3失敗");}
          );
          
          tx.executeSql(
            `alter table "staff_mst" add column "top_staff_list" text;`,
            [],
            () => {console.log("設定2-4追加");},
            (e) => {console.log("設定2-4失敗");}
          );
          
          tx.executeSql(
            `alter table "staff_mst" add column "setting_list7_mail" text;`,
            [],
            () => {console.log("設定2-7追加");},
            (e) => {console.log("設定2-7失敗");}
          );
          
        }
        
        if(rows._array.length == 24) {
          tx.executeSql(
            `alter table "staff_mst" add column "fc_flg" text;`,
            [],
            () => {console.log("fc_flg追加");},
            (e) => {console.log("fc_flg失敗");}
          );
        }
        
      },
      () => {
        console.log("スタッフテーブル　カラム追加失敗");
        
      }
    );
    
    tx.executeSql(
      `select * from staff_mst;`,  
      [],
      () => {console.log("ローカルDBはすでに作成されています");},
      () => {
  
              // スタッフテーブル追加
              tx.executeSql(
                `CREATE TABLE "staff_mst" (
                	"account"	TEXT UNIQUE,
                	"password"	TEXT,
                	"shop_id"	TEXT,
                	"name_1"	TEXT,
                	"name_2"	TEXT,
                	"name"	TEXT,
                	"corporations_name"	TEXT,
                	"setting_list"	TEXT,
                	"app_token"	TEXT,
                	"system_mail"	TEXT,
                	"yahoomail"	TEXT,
                	"gmail"	TEXT,
                	"hotmail"	TEXT,
                	"outlook"	TEXT,
                	"softbank"	TEXT,
                	"icloud"	TEXT,
                	"original_mail"	TEXT,
                	"line_id"	TEXT,
                	"mail_name"	TEXT,
                	"mail1"	TEXT,
                	"mail2"	TEXT,
                	"mail3"	TEXT,
                	"top_staff_list"	TEXT,
                	"setting_list7_mail"	TEXT,
                	"fc_flg"	TEXT,
                	PRIMARY KEY("account")
                );`,
                [],
                () => {console.log("スタッフテーブル追加");},
                () => {console.log("スタッフテーブル追加失敗");}
              );
              
              // スタッフインデックス作成
              tx.executeSql(
                `CREATE INDEX "index_staff_mst" ON "staff_mst" (
                	"account",
                	"shop_id"
                );`,
                [],
                () => {console.log("スタッフインデックス作成");},
                () => {console.log("スタッフインデックス作成失敗");}
              );
              
              // スタッフ一覧テーブル追加
              tx.executeSql(
                `CREATE TABLE "staff_list" (
                	"account"	TEXT UNIQUE,
                	"name_1"	TEXT,
                	"name_2"	TEXT,
                	"check"	TEXT,
                	PRIMARY KEY("account")
                );`,
                [],
                () => {console.log("スタッフ一覧テーブル追加");},
                () => {console.log("スタッフ一覧テーブル追加失敗");}
              );
              
              // スタッフ一覧インデックス作成
              tx.executeSql(
                `CREATE INDEX "index_staff_list" ON "staff_list" (
                	"account"
                );`,
                [],
                () => {console.log("スタッフ一覧インデックス作成");},
                () => {console.log("スタッフ一覧インデックス作成失敗");}
              );
              
              // お客様テーブル追加
              tx.executeSql(
                `CREATE TABLE "customer_mst" (
                	"customer_id" TEXT UNIQUE,
                	"name" TEXT,
                	"kana" TEXT,
                	"time"	TEXT,
                	"title"	TEXT,
                	"note"	TEXT,
                	"mail1"	TEXT,
                	"mail2"	TEXT,
                	"mail3"	TEXT,
                	"line"	TEXT,
                	"staff_name"	TEXT,
                	"media"	TEXT,
                	"article_url"	TEXT,
                	"reverberation_user_id"	TEXT,
                	"coming_user_id"	TEXT,
                	"coming_day1"	TEXT,
                	"status"	TEXT,
                	PRIMARY KEY("customer_id")
                );`,
                [],
                () => {console.log("お客様テーブル追加");},
                () => {console.log("お客様テーブル追加失敗");}
              );
              
              // お客様インデックス作成
              tx.executeSql(
                `CREATE INDEX "index_customer_mst" ON "customer_mst" (
                	"customer_id"
                );`,
                [],
                () => {console.log("お客様インデックス作成");},
                () => {console.log("お客様インデックス作成失敗");}
              );
              
              // コミュニケーション履歴テーブル追加
              tx.executeSql(
                `CREATE TABLE "communication_mst" (
                	"communication_id" TEXT UNIQUE,
                	"customer_id" TEXT,
                	"speaker" TEXT,
                	"time" TEXT,
                	"title" TEXT,
                	"note" TEXT,
                	"line_note" TEXT,
                	"file_path" TEXT,
                	"status" TEXT,
                	"html_flg" TEXT,
                	PRIMARY KEY("communication_id")
                );`,
                [],
                () => {console.log("コミュニケーション履歴テーブル追加");},
                () => {console.log("コミュニケーション履歴テーブル追加失敗");}
              );
              
              // コミュニケーション履歴インデックス作成
              tx.executeSql(
                `CREATE INDEX "index_communication_mst" ON "communication_mst" (
                	"customer_id",
                	"time",
                	"status"
                );`,
                [],
                () => {console.log("コミュニケーション履歴インデックス作成");},
                () => {console.log("コミュニケーション履歴インデックス作成失敗");}
              );
              
              // 定型文テーブル追加
              tx.executeSql(
                `CREATE TABLE "fixed_mst" (
                	"fixed_id"	TEXT,
                	"category"	TEXT,
                	"title"	TEXT,
                	"mail_title"	TEXT,
                	"note"	TEXT
                );`,
                [],
                () => {console.log("定型文テーブル追加");},
                () => {console.log("定型文テーブル追加失敗");}
              );
              // 定型文インデックス作成
              tx.executeSql(
                `CREATE INDEX "index_fixed_mst" ON "fixed_mst" (
                	"category"
                );`,
                [],
                () => {console.log("定型文インデックス作成");},
                () => {console.log("定型文インデックス作成失敗");}
              );
              
              // 駅・エリアテーブル追加
              tx.executeSql(
                `CREATE TABLE "station_mst" (
                	"id"	TEXT,
                	"name"	TEXT
                );`,
                [],
                () => {console.log("駅・エリアテーブル追加");},
                () => {console.log("駅・エリアテーブル追加失敗");}
              );
              
              // 住所テーブル追加
              tx.executeSql(
                `CREATE TABLE "address_mst" (
                	"id"	TEXT,
                	"name"	TEXT
                );`,
                [],
                () => {console.log("住所テーブル追加");},
                () => {console.log("住所テーブル追加失敗");}
              );
              resolve();
            }
    );
    
    tx.executeSql(
      `select * from staff_profile;`,  
      [],
      () => {console.log("ローカルDB[スタッフプロフィール]はすでに作成されています");},
      () => {
              // スタッフプロフィールテーブル追加
              tx.executeSql(
                `CREATE TABLE "staff_profile" (
                	"staff_id"	TEXT UNIQUE,
                	"birthplace"	TEXT,
                	"birthday"	TEXT,
                	"profile_tag"	TEXT,
                	"staff_photo1"	TEXT,
                	"staff_photo2"	TEXT,
                	"staff_photo3"	TEXT,
                	"staff_photo4"	TEXT,
                	PRIMARY KEY("staff_id")
                );`,
                [],
                () => {console.log("スタッフプロフィールテーブル追加");},
                () => {console.log("スタッフプロフィールテーブル追加失敗");}
              );

              resolve();
            }
    );

    // ランキング用テーブル追加
    tx.executeSql(
      `select * from ranking_mst;`,  
      [],
      () => {console.log("ローカルDB[ランキング]はすでに作成されています");},
      () => {
              // スタッフプロフィールテーブル追加
              tx.executeSql(
                `CREATE TABLE "ranking_mst" (
                	"id"	INTEGER PRIMARY KEY AUTOINCREMENT,
                	"date"	TEXT,
                	"getdate"	TEXT,
                	"ranking"	INTEGER,
                	"ranking_total"	INTEGER,
                	"estimate_d"	TEXT,
                	"estimate_r"	INTEGER,
                	"coming_new_d"	INTEGER,
                	"coming_new_r"	INTEGER,
                	"coming_intro_d"	INTEGER,
                	"coming_intro_r"	INTEGER,
                	"agreement_d"	INTEGER,
                	"agreement_r"	INTEGER,
                	"comrev_d"	TEXT,
                	"comrev_r"	INTEGER
                );`,
                [],
                () => {console.log("ランキングテーブル追加");},
                () => {console.log("ランキングテーブル追加失敗");}
              );

              resolve();
            }
    );
    
    // 売上グラフ用テーブル追加
    tx.executeSql(
      `select * from black_sales_mst;`,  
      [],
      () => {console.log("ローカルDB[売上グラフ]はすでに作成されています");},
      () => {
              // スタッフプロフィールテーブル追加
              tx.executeSql(
                `CREATE TABLE "black_sales_mst" (
                	"id"	INTEGER PRIMARY KEY AUTOINCREMENT,
                	"date"	TEXT,
                	"Jan"	INTEGER,
                	"Feb"	INTEGER,
                	"Mar"	INTEGER,
                	"Apr"	INTEGER,
                	"May"	INTEGER,
                	"Jun"	INTEGER,
                	"Jul"	INTEGER,
                	"Aug"	INTEGER,
                	"Sep"	INTEGER,
                	"Oct"	INTEGER,
                	"Nov"	INTEGER,
                	"Dec"	INTEGER
                );`,
                [],
                () => {console.log("売上グラフテーブル追加");},
                () => {console.log("売上グラフテーブル追加失敗");}
              );

              resolve();
            }
    );

    // tx.executeSql(
    //   `drop table staff_mst;`,
    //   [],
    //   () => {console.log("staff_mst 削除");},
    //   () => {console.log("失敗");}
    // );
    // tx.executeSql(
    //   `drop table staff_list;`,
    //   [],
    //   () => {console.log("staff_list 削除");},
    //   () => {console.log("失敗");}
    // );
    // tx.executeSql(
    //   `drop table customer_mst;`,
    //   [],
    //   () => {console.log("customer_mst 削除");},
    //   () => {console.log("失敗");}
    // );
    // tx.executeSql(
    //   `drop table communication_mst;`,
    //   [],
    //   () => {console.log("communication_mst 削除");},
    //   () => {console.log("失敗");}
    // );
    // tx.executeSql(
    //   `drop table fixed_mst;`,
    //   [],
    //   () => {console.log("fixed_mst 削除");},
    //   () => {console.log("失敗");}
    // );
    // tx.executeSql(
    //   `drop table station_mst;`,
    //   [],
    //   () => {console.log("station_mst 削除");},
    //   () => {console.log("失敗");}
    // );
    // tx.executeSql(
    //   `drop table address_mst;`,
    //   [],
    //   () => {console.log("address_mst 削除");},
    //   () => {console.log("失敗");}
    // );
    
    // カラム名確認
    // tx.executeSql(
    //   `PRAGMA table_info('customer_mst');`,
    //   [],
    //   (_, { rows }) => {
    //     // console.log(rows._array);
    //     rows._array.map((n) =>{
    //       console.log(n.name)
    //     })
    //   },
    //   () => {
    //     console.log("失敗");
        
    //   }
    // );
    
  });
  
  resolve();
  });
  
}

exports.GetDB = function(table){
    
  return new Promise((resolve, reject)=>{
    module.exports.db.transaction((tx) => {
      tx.executeSql(
        `select * from `+table+`;`,
        [],
        (_, { rows }) => {
          if (rows._array.length > 0) {
            resolve(rows._array);
          } else {
            resolve(false);
          }
        },
        () => {
          console.log("select "+table+" faileaaaaaaaaaaaaaa");
        }
      )
    })
  })
}