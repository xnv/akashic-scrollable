# インストール

ゲームのルートディレクトリ(game.jsonのあるディレクトリ)で `akashic` コマンド ([akashic-cli][cli]) を実行してください:

```
akashic install @xnv/akashic-scrollable
```

あるいは `npm` で:

```
npm i --save -E @xnv/akashic-scrollable
npm shrinkwrap
```

shrinkwrap することを推奨します。(`akashic` は自動的に行います)

`akashic init -t typescript` で生成されたTypeScriptテンプレートを利用している場合、
これに加えプロジェクトのルートディレクトリ(`akashic init` を実行したディレクトリ)でもインストールを行う必要があります。

```
npm install -DE @xnv/akashic-scrollable
```

これはTypeScriptテンプレートが、コンパイル時(.d.ts)と実行時(.js)の両方でライブラリを必要とするためです。

[cli]: https://github.com/akashic-games/akashic-cli
