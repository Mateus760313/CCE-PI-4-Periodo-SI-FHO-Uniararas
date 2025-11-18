toc.dat                                                                                             0000600 0004000 0002000 00000040246 15107133404 0014443 0                                                                                                    ustar 00postgres                        postgres                        0000000 0000000                                                                                                                                                                        PGDMP                   
    }         
   meusistema    18.0    18.0 5    “           0    0    ENCODING    ENCODING        SET client_encoding = 'UTF8';
                           false         ”           0    0 
   STDSTRINGS 
   STDSTRINGS     (   SET standard_conforming_strings = 'on';
                           false         ‘           0    0 
   SEARCHPATH 
   SEARCHPATH     8   SELECT pg_catalog.set_config('search_path', '', false);
                           false         ’           1262    16388 
   meusistema    DATABASE     Å   
    DROP DATABASE meusistema;
                     postgres    false         ‡            1259    24614 	   aparelhos    TABLE     #  CREATE TABLE public.aparelhos (
    id bigint NOT NULL,
    residencia_id bigint NOT NULL,
    usuario_id integer NOT NULL,
    nome character varying(150) NOT NULL,
    potencia_watts integer NOT NULL,
    horas_uso double precision NOT NULL,
    data_criacao timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    comodo_id bigint,
    CONSTRAINT aparelhos_horas_uso_check CHECK (((horas_uso >= (0)::double precision) AND (horas_uso <= (24)::double precision))),
    CONSTRAINT aparelhos_potencia_watts_check CHECK ((potencia_watts > 0))
);
    DROP TABLE public.aparelhos;
       public         heap r       postgres    false         ﬂ            1259    24613    aparelhos_id_seq    SEQUENCE     y   CREATE SEQUENCE public.aparelhos_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 '   DROP SEQUENCE public.aparelhos_id_seq;
       public               postgres    false    224         ÷           0    0    aparelhos_id_seq    SEQUENCE OWNED BY     E   ALTER SEQUENCE public.aparelhos_id_seq OWNED BY public.aparelhos.id;
          public               postgres    false    223         ‰            1259    32808     comodos    TABLE        CREATE TABLE public.comodos (
    id bigint NOT NULL,
    residencia_id bigint NOT NULL,
    nome character varying(150) NOT NULL,
    imagem character varying(150),
    data_criacao timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);
    DROP TABLE public.comodos;
       public         heap r       postgres    false         „            1259    32807    comodos_id_seq    SEQUENCE     w   CREATE SEQUENCE public.comodos_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 %   DROP SEQUENCE public.comodos_id_seq;
       public               postgres    false    228         ◊           0    0    comodos_id_seq    SEQUENCE OWNED BY     A   ALTER SEQUENCE public.comodos_id_seq OWNED BY public.comodos.id;
          public               postgres    false    227         ‚            1259    32788    recuperacao_senha    TABLE     0  CREATE TABLE public.recuperacao_senha (
    id integer NOT NULL,
    usuario_id integer NOT NULL,
    token character varying(64) NOT NULL,
    data_expiracao timestamp without time zone NOT NULL,
    usado boolean DEFAULT false,
    data_criacao timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);
 %   DROP TABLE public.recuperacao_senha;
       public         heap r       postgres    false         ·            1259    32787    recuperacao_senha_id_seq    SEQUENCE     ê   CREATE SEQUENCE public.recuperacao_senha_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 /   DROP SEQUENCE public.recuperacao_senha_id_seq;
       public               postgres    false    226         ÿ           0    0    recuperacao_senha_id_seq    SEQUENCE OWNED BY     U   ALTER SEQUENCE public.recuperacao_senha_id_seq OWNED BY public.recuperacao_senha.id;
          public               postgres    false    225         ﬁ            1259    24596 
   residencias    TABLE     <  CREATE TABLE public.residencias (
    id bigint NOT NULL,
    usuario_id integer NOT NULL,
    nome character varying(150) NOT NULL,
    imagem character varying(150) NOT NULL,
    data_criacao timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    cidade character varying(100),
    tarifa_kwh numeric(10,2)
);
    DROP TABLE public.residencias;
       public         heap r       postgres    false         ›            1259    24595    residencias_id_seq    SEQUENCE     {   CREATE SEQUENCE public.residencias_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 )   DROP SEQUENCE public.residencias_id_seq;
       public               postgres    false    222         Ÿ           0    0    residencias_id_seq    SEQUENCE OWNED BY     I   ALTER SEQUENCE public.residencias_id_seq OWNED BY public.residencias.id;
          public               postgres    false    221         ‹            1259    16390    usuarios    TABLE     ˇ   CREATE TABLE public.usuarios (
    id integer NOT NULL,
    nome character varying(100) NOT NULL,
    email character varying(100) NOT NULL,
    senha_hash character(60) NOT NULL,
    data_cadastro timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);
    DROP TABLE public.usuarios;
       public         heap r       postgres    false         €            1259    16389    usuarios_id_seq    SEQUENCE     á   CREATE SEQUENCE public.usuarios_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 &   DROP SEQUENCE public.usuarios_id_seq;
       public               postgres    false    220         ⁄           0    0    usuarios_id_seq    SEQUENCE OWNED BY     C   ALTER SEQUENCE public.usuarios_id_seq OWNED BY public.usuarios.id;
          public               postgres    false    219                    2604    24617    aparelhos id     DEFAULT     l   ALTER TABLE ONLY public.aparelhos ALTER COLUMN id SET DEFAULT nextval('public.aparelhos_id_seq'::regclass);
 ;   ALTER TABLE public.aparelhos ALTER COLUMN id DROP DEFAULT;
       public               postgres    false    224    223    224                    2604    32811 
   comodos id     DEFAULT     h   ALTER TABLE ONLY public.comodos ALTER COLUMN id SET DEFAULT nextval('public.comodos_id_seq'::regclass);
 9   ALTER TABLE public.comodos ALTER COLUMN id DROP DEFAULT;
       public               postgres    false    227    228    228                    2604    32791    recuperacao_senha id     DEFAULT     |   ALTER TABLE ONLY public.recuperacao_senha ALTER COLUMN id SET DEFAULT nextval('public.recuperacao_senha_id_seq'::regclass);
 C   ALTER TABLE public.recuperacao_senha ALTER COLUMN id DROP DEFAULT;
       public               postgres    false    225    226    226                    2604    24599    residencias id     DEFAULT     p   ALTER TABLE ONLY public.residencias ALTER COLUMN id SET DEFAULT nextval('public.residencias_id_seq'::regclass);
 =   ALTER TABLE public.residencias ALTER COLUMN id DROP DEFAULT;
       public               postgres    false    222    221    222                    2604    16393 
   usuarios id     DEFAULT     j   ALTER TABLE ONLY public.usuarios ALTER COLUMN id SET DEFAULT nextval('public.usuarios_id_seq'::regclass);
 :   ALTER TABLE public.usuarios ALTER COLUMN id DROP DEFAULT;
       public               postgres    false    220    219    220         À          0    24614 	   aparelhos 
   TABLE DATA           |   COPY public.aparelhos (id, residencia_id, usuario_id, nome, potencia_watts, horas_uso, data_criacao, comodo_id) FROM stdin;
    public               postgres    false    224       5067.dat œ          0    32808     comodos 
   TABLE DATA           P   COPY public.comodos (id, residencia_id, nome, imagem, data_criacao) FROM stdin;
    public               postgres    false    228       5071.dat Õ          0    32788    recuperacao_senha 
   TABLE DATA           g   COPY public.recuperacao_senha (id, usuario_id, token, data_expiracao, usado, data_criacao) FROM stdin;
    public               postgres    false    226       5069.dat …          0    24596 
   residencias 
   TABLE DATA           e   COPY public.residencias (id, usuario_id, nome, imagem, data_criacao, cidade, tarifa_kwh) FROM stdin;
    public               postgres    false    222       5065.dat «          0    16390    usuarios 
   TABLE DATA           N   COPY public.usuarios (id, nome, email, senha_hash, data_cadastro) FROM stdin;
    public               postgres    false    220       5063.dat €           0    0    aparelhos_id_seq    SEQUENCE SET     ?   SELECT pg_catalog.setval('public.aparelhos_id_seq', 17, true);
          public               postgres    false    223         ‹           0    0    comodos_id_seq    SEQUENCE SET     =   SELECT pg_catalog.setval('public.comodos_id_seq', 25, true);
          public               postgres    false    227         ›           0    0    recuperacao_senha_id_seq    SEQUENCE SET     G   SELECT pg_catalog.setval('public.recuperacao_senha_id_seq', 13, true);
          public               postgres    false    225         ﬁ           0    0    residencias_id_seq    SEQUENCE SET     @   SELECT pg_catalog.setval('public.residencias_id_seq', 8, true);
          public               postgres    false    221         ﬂ           0    0    usuarios_id_seq    SEQUENCE SET     >   SELECT pg_catalog.setval('public.usuarios_id_seq', 51, true);
          public               postgres    false    219         !           2606    24628    aparelhos aparelhos_pkey 
   CONSTRAINT     V   ALTER TABLE ONLY public.aparelhos
    ADD CONSTRAINT aparelhos_pkey PRIMARY KEY (id);
 B   ALTER TABLE ONLY public.aparelhos DROP CONSTRAINT aparelhos_pkey;
       public                 postgres    false    224         *           2606    32817    comodos comodos_pkey 
   CONSTRAINT     R   ALTER TABLE ONLY public.comodos
    ADD CONSTRAINT comodos_pkey PRIMARY KEY (id);
 >   ALTER TABLE ONLY public.comodos DROP CONSTRAINT comodos_pkey;
       public                 postgres    false    228         &           2606    32799 (   recuperacao_senha recuperacao_senha_pkey 
   CONSTRAINT     f   ALTER TABLE ONLY public.recuperacao_senha
    ADD CONSTRAINT recuperacao_senha_pkey PRIMARY KEY (id);
 R   ALTER TABLE ONLY public.recuperacao_senha DROP CONSTRAINT recuperacao_senha_pkey;
       public                 postgres    false    226         (           2606    32801 -   recuperacao_senha recuperacao_senha_token_key 
   CONSTRAINT     i   ALTER TABLE ONLY public.recuperacao_senha
    ADD CONSTRAINT recuperacao_senha_token_key UNIQUE (token);
 W   ALTER TABLE ONLY public.recuperacao_senha DROP CONSTRAINT recuperacao_senha_token_key;
       public                 postgres    false    226                    2606    24606    residencias residencias_pkey 
   CONSTRAINT     Z   ALTER TABLE ONLY public.residencias
    ADD CONSTRAINT residencias_pkey PRIMARY KEY (id);
 F   ALTER TABLE ONLY public.residencias DROP CONSTRAINT residencias_pkey;
       public                 postgres    false    222                    2606    16402    usuarios usuarios_email_key 
   CONSTRAINT     W   ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_email_key UNIQUE (email);
 E   ALTER TABLE ONLY public.usuarios DROP CONSTRAINT usuarios_email_key;
       public                 postgres    false    220                    2606    16400    usuarios usuarios_pkey 
   CONSTRAINT     T   ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_pkey PRIMARY KEY (id);
 @   ALTER TABLE ONLY public.usuarios DROP CONSTRAINT usuarios_pkey;
       public                 postgres    false    220         "           1259    32830    idx_aparelhos_comodo    INDEX     O   CREATE INDEX idx_aparelhos_comodo ON public.aparelhos USING btree (comodo_id);
 (   DROP INDEX public.idx_aparelhos_comodo;
       public                 postgres    false    224         #           1259    24639    idx_aparelhos_residencia    INDEX     W   CREATE INDEX idx_aparelhos_residencia ON public.aparelhos USING btree (residencia_id);
 ,   DROP INDEX public.idx_aparelhos_residencia;
       public                 postgres    false    224         $           1259    24640    idx_aparelhos_usuario    INDEX     Q   CREATE INDEX idx_aparelhos_usuario ON public.aparelhos USING btree (usuario_id);
 )   DROP INDEX public.idx_aparelhos_usuario;
       public                 postgres    false    224         +           1259    32824    idx_comodos_residencia    INDEX     S   CREATE INDEX idx_comodos_residencia ON public.comodos USING btree (residencia_id);
 *   DROP INDEX public.idx_comodos_residencia;
       public                 postgres    false    228                    1259    24612    idx_residencias_usuario    INDEX     U   CREATE INDEX idx_residencias_usuario ON public.residencias USING btree (usuario_id);
 +   DROP INDEX public.idx_residencias_usuario;
       public                 postgres    false    222         ,           1259    32823    uq_comodos_residencia_nome    INDEX     d   CREATE UNIQUE INDEX uq_comodos_residencia_nome ON public.comodos USING btree (residencia_id, nome);
 .   DROP INDEX public.uq_comodos_residencia_nome;
       public                 postgres    false    228    228         .           2606    32825    aparelhos fk_aparelhos_comodo 
   FK CONSTRAINT     ì   ALTER TABLE ONLY public.aparelhos
    ADD CONSTRAINT fk_aparelhos_comodo FOREIGN KEY (comodo_id) REFERENCES public.comodos(id) ON DELETE SET NULL;
 G   ALTER TABLE ONLY public.aparelhos DROP CONSTRAINT fk_aparelhos_comodo;
       public               postgres    false    4906    224    228         /           2606    24629 !   aparelhos fk_aparelhos_residencia 
   FK CONSTRAINT     û   ALTER TABLE ONLY public.aparelhos
    ADD CONSTRAINT fk_aparelhos_residencia FOREIGN KEY (residencia_id) REFERENCES public.residencias(id) ON DELETE CASCADE;
 K   ALTER TABLE ONLY public.aparelhos DROP CONSTRAINT fk_aparelhos_residencia;
       public               postgres    false    222    224    4895         0           2606    24634    aparelhos fk_aparelhos_usuario 
   FK CONSTRAINT     ï   ALTER TABLE ONLY public.aparelhos
    ADD CONSTRAINT fk_aparelhos_usuario FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id) ON DELETE CASCADE;
 H   ALTER TABLE ONLY public.aparelhos DROP CONSTRAINT fk_aparelhos_usuario;
       public               postgres    false    220    4892    224         2           2606    32818    comodos fk_comodos_residencia 
   FK CONSTRAINT     ö   ALTER TABLE ONLY public.comodos
    ADD CONSTRAINT fk_comodos_residencia FOREIGN KEY (residencia_id) REFERENCES public.residencias(id) ON DELETE CASCADE;
 G   ALTER TABLE ONLY public.comodos DROP CONSTRAINT fk_comodos_residencia;
       public               postgres    false    4895    222    228         -           2606    24607 !   residencias fk_residencia_usuario 
   FK CONSTRAINT     ò   ALTER TABLE ONLY public.residencias
    ADD CONSTRAINT fk_residencia_usuario FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id) ON DELETE CASCADE;
 K   ALTER TABLE ONLY public.residencias DROP CONSTRAINT fk_residencia_usuario;
       public               postgres    false    222    4892    220         1           2606    32802 3   recuperacao_senha recuperacao_senha_usuario_id_fkey 
   FK CONSTRAINT     ò   ALTER TABLE ONLY public.recuperacao_senha
    ADD CONSTRAINT recuperacao_senha_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id);
 ]   ALTER TABLE ONLY public.recuperacao_senha DROP CONSTRAINT recuperacao_senha_usuario_id_fkey;
       public               postgres    false    4892    220    226                                                                                                                                                                                                                                                                                                                                                                  5067.dat                                                                                            0000600 0004000 0002000 00000001372 15107133404 0014254 0                                                                                                    ustar 00postgres                        postgres                        0000000 0000000                                                                                                                                                                        3	2	37	Geladeira	240	24	2025-10-29 18:43:40.756064	2
4	2	37	Ar condicionado	2000	1	2025-10-29 18:43:47.893009	2
5	3	38	Ares condicionados	1500	12	2025-10-29 18:44:45.307438	3
6	4	40	Makita	20000	12	2025-10-29 18:46:40.503947	4
7	4	40	Geladeira LG	1500	24	2025-10-29 18:50:27.923954	4
8	4	40	Computadores	200	12	2025-10-29 18:52:57.335939	4
9	1	3	Geladeira da churrasqueira	225	24	2025-10-29 19:01:23.843208	1
14	6	44	Geladeira Electrolux2005	2005	24	2025-11-04 16:41:28.505438	6
10	5	3	Sistema	120	24	2025-10-30 16:25:09.492884	\N
11	5	3	AC	2400	12	2025-10-30 16:25:19.912241	\N
12	5	3	Computadores	100	10	2025-10-30 16:26:32.294626	\N
13	5	3	Sistema de luzes	12	12	2025-10-30 16:27:26.515179	\N
17	5	3	Computador Mancer	500	24	2025-11-18 01:35:02.865154	7
\.


                                                                                                                                                                                                                                                                      5071.dat                                                                                            0000600 0004000 0002000 00000001462 15107133404 0014247 0                                                                                                    ustar 00postgres                        postgres                        0000000 0000000                                                                                                                                                                        1	1	Sem c‚Äúmodo	\N	2025-11-18 00:02:41.039641
2	2	Sem c‚Äúmodo	\N	2025-11-18 00:02:41.039641
3	3	Sem c‚Äúmodo	\N	2025-11-18 00:02:41.039641
4	4	Sem c‚Äúmodo	\N	2025-11-18 00:02:41.039641
6	6	Sem c‚Äúmodo	\N	2025-11-18 00:02:41.039641
8	1	Cozinha	\N	2025-11-18 00:14:20.980996
9	7	Cozinha	\N	2025-11-18 00:15:34.545207
13	8	Cozinha	\N	2025-11-18 00:47:39.497715
17	8	Quarto	\N	2025-11-18 00:51:04.439034
18	8	Cozinha 2	\N	2025-11-18 00:51:12.281336
19	8	Museu	\N	2025-11-18 00:51:47.086183
20	8	Banheiro	\N	2025-11-18 01:01:31.254391
21	8	Banheiro quimico	\N	2025-11-18 01:01:52.922732
22	8	Banheiro quimico2	\N	2025-11-18 01:01:58.073765
23	8	Joaninha	\N	2025-11-18 01:03:04.446271
24	8	Jaco	\N	2025-11-18 01:06:13.451408
25	8	Isaac	\N	2025-11-18 01:07:14.014372
7	5	Quarto-Gabriel	\N	2025-11-18 00:09:37.746844
\.


                                                                                                                                                                                                              5069.dat                                                                                            0000600 0004000 0002000 00000003023 15107133404 0014251 0                                                                                                    ustar 00postgres                        postgres                        0000000 0000000                                                                                                                                                                        1	42	e61e470bfe39e636f29edbcaf8f1aec66ae52242bd6cd22bf54d7c43c05227cc	2025-11-04 21:22:48	f	2025-11-04 16:22:48.778805
2	42	84f7406d3f7ed341ef0b8d795a5534f84b87b2dcdb8d0051898222ea9a0256ba	2025-11-04 21:24:45	f	2025-11-04 16:24:45.978789
3	44	0af20ad6e3014c05e838b837f2d935fde965503de0220d4bb160e155c66c5e52	2025-11-04 21:30:17	f	2025-11-04 16:30:17.776044
4	44	6f4cea13313a990c70846c62ba56bbe20c36a405ec7d19a359bfb51d836bdef0	2025-11-04 21:35:28	f	2025-11-04 16:35:28.385847
5	44	f1f7070e33ea5f1d4a0bb77d9e4c969bfe8e4c554768f567017cb061b18d54d7	2025-11-04 21:40:07	t	2025-11-04 16:40:07.901176
6	46	ab066e76986e0cf16dae96c622cc9aaf20247593b2bbc361c678ee236fa4cac1	2025-11-04 22:06:37	t	2025-11-04 17:06:37.37098
7	46	3ae4866026d4724d2cf5f03e3e011938ff824c68efed317cebe208504f085d72	2025-11-04 22:07:20	f	2025-11-04 17:07:20.457789
8	47	c6e4434b2db643dad5ea510a9d408678c21a8f67e3a359abcd07a22075c7ac49	2025-11-04 22:18:29	t	2025-11-04 17:18:29.170277
9	47	29b7d56e8de5ca576067745c95cbe6f25626d562d76e3b59d405b5efb60ef76f	2025-11-04 22:22:48	f	2025-11-04 17:22:48.700497
10	47	cfff253400aa200c57e480e6a754a0fdb9295c91737d4571866df1843bae9d3c	2025-11-04 22:24:22	f	2025-11-04 17:24:22.663332
11	48	20bbf2fd55b613dfc1588205a7f9854d1583686e21efbad937cad3f3f3624cdc	2025-11-04 22:25:26	t	2025-11-04 17:25:26.965997
12	50	a8b0faeca3e907088bd543bce9ea40b9e218576ec0f567eb67fd746332cef3b8	2025-11-18 05:17:06	t	2025-11-18 00:17:06.346244
13	50	debe692c430398c8d1a79b1213b110f430d4d2996cfc4b8f6d81d8aca317be7c	2025-11-18 05:19:25	f	2025-11-18 00:19:25.343152
\.


                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             5065.dat                                                                                            0000600 0004000 0002000 00000000733 15107133404 0014252 0                                                                                                    ustar 00postgres                        postgres                        0000000 0000000                                                                                                                                                                        1	3	Casa Araras	casa	2025-10-29 18:42:19.97539	\N	\N
2	37	Apartamento praia	apartamento	2025-10-29 18:43:34.257766	\N	\N
3	38	Escritorio ADC	escritorio	2025-10-29 18:44:30.493815	\N	\N
4	40	Casa usina	casa	2025-10-29 18:46:31.683054	\N	\N
6	44	Casinha bonita	casa	2025-11-04 16:41:14.28588	\N	\N
7	49	Casa	sitio	2025-11-18 00:15:27.362639	\N	\N
8	51	Casa usina	escritorio	2025-11-18 00:47:35.031578	\N	\N
5	3	Escritorio ADC	escritorio	2025-10-30 16:24:57.147904	\N	0.70
\.


                                     5063.dat                                                                                            0000600 0004000 0002000 00000012667 15107133404 0014261 0                                                                                                    ustar 00postgres                        postgres                        0000000 0000000                                                                                                                                                                        1	Mateus Xamps	mateussilva@gmail.com	$2y$10$yR5EMQYu4atMti0c3zSKBO1ZwO90Y7u/xibgANynZw06ANJWoZA/q	2025-10-11 21:56:59.394138
2	henrique	henrique@gmail.com	$2y$10$DwS7hC1nfvM7AoeDhBLR8Oe/qbinWBuZdx8bjcvveQaP8tkCRzo7a	2025-10-11 22:00:56.031334
3	Mateus Xamps	mateusxampp@gmail.com	$2y$10$cuTNi838trozloUrekjd0uCJ9XhLUhIezyrrOX2PxP/7geZkj9glu	2025-10-11 22:03:53.938488
4	Gilberto	gilsilva@outlook.com	$2y$10$G3WX0jtqryfKFEQVxkOkCOW5h3EqiK.UEDUo4rqbSHrhfO7FRK8qO	2025-10-11 22:10:34.072767
5	Joao Gabriel	joaoguilhermegabriel@yahoo.com.br	$2y$10$kDeIfAqVNxj07HIpDH653O6vCBZXKs963bLHyjgV9LrscW7nvLHU6	2025-10-12 19:19:18.616248
6	Alice Silva	alice.silva@teste.com	$2a$10$abcdefghijklmnopqrstuvwxyz0123456789ABCDEFGHIJ       	2025-10-14 01:57:24.036535
7	Bruno Costa	bruno.costa@teste.com	$2a$10$ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefgh         	2025-10-14 01:57:24.036535
8	Carla Souza	carla.souza@teste.com	$2a$10$9876543210zyxwuvtsrqponmlkjihgfedcbaZYXWVUTSRQ       	2025-10-14 01:57:24.036535
9	Daniel Almeida	daniel.almeida@teste.com	$2a$10$FEDCBA9876543210zyxwuvtsrqponmlkjihgfedcbaZYXW       	2025-10-14 01:57:24.036535
10	Joaquim Phoenix	joaquimphoenix@outlook.com	$2y$10$Kg7SJj7qYGuLsbXP9Xxxb.rK350F5fTeuXnGAaLEjZCYEKry3ui36	2025-10-28 18:15:53.165872
11	Jean Pierre	jeansilva@gmail.com	$2y$10$kS2YirZsaykfAePwHaqWZOEaAm.dQXc1zXT7iq5jLMA/GkZbxPWHu	2025-10-28 18:25:09.124246
13	Jean Pierre Ka	jeansilva22@gmail.com	$2y$10$M50E43gnuTWlLjAtD2hO0.ywD3fTwU7r9IZXHMXIEdiIeF6kYkSVi	2025-10-28 18:25:45.575379
14	Mateus Fogagnoli	mateusxamps24@gmail.com	$2y$10$w1PmoEFXVMhdbE5QoKVgQOWAPAV5xGLjoe1ZgZ.Uuc9zwPkdd3ugW	2025-10-28 19:50:39.961507
15	Camili Silva	seuemail@exemplo.com	$2y$10$FLoLkq6OYjLVQ36n2vj4PuEGAk0cmPL2JPS24t2vd5qtsXuj8EAqC	2025-10-28 20:01:43.335702
16	Jean Pierre	jeansilvamma@gmail.com	$2y$10$brbaVPBYwVkvoVwb.Syn5eQqtwbF7gvg4FkxCxwHHoDJLetUffw16	2025-10-28 20:02:30.575819
17	Gabriel Brandino	gabrielbrandino@gmail.com	$2y$10$P4WOGLiqC4Tv8YANM1hH1uYulrM68p3c6D2WMdTt15fCyaPyxoVMK	2025-10-28 20:04:02.989771
18	Mateus Xamps	ggilsilva@outlook.com	$2y$10$Fd9P3uFmpaDAmr3zuJ1.neB8g41ulz2EX4INJylgVQ50GtMvq.JiO	2025-10-28 20:05:27.670897
21	Mateus Xamps	gilsilva24@gmail.com	$2y$10$Y7MAUQ.CHvMLbur3wZnf.OmXgpJLISzC5j.B0YBEsLVCHSdgPqz6S	2025-10-28 20:05:56.366041
22	henrique	alexandrepereira@gmail.com	$2y$10$XY12y1iP7W2ny5pOJMMEn.gaRP8Ed4fuBGVkWIawSLjh78tLGcqTu	2025-10-28 20:08:16.091128
24	henrique pereira	mateusxamp22p@gmail.com	$2y$10$QM2VWwQlQSHhZPPY8pzH4uNu0FZpURfDqlCtX5zTSRMlucOCZ7FVi	2025-10-29 00:29:41.462766
26	Gilberto Pereira	gilsilvapereira@yahoo.com.br	$2y$10$RLdxYYROE5eXQTDuhcbTHuV1OVrkvpjnmlMly/fcr0FcTHbeuPZw2	2025-10-29 00:32:08.48147
27	Mateus Xampinho	mateuspenteneiro@gmail.com	$2y$10$vI.uFWp6w.r42IME13mbDe1LXjPfHWm79N6pB5Qiuiy8XTL9BS.EO	2025-10-29 00:37:29.790228
28	Alex do Bronx	alexpoatanpereira@gmail.com	$2y$10$dC3f5G5X/Eyl0C674OCnOO3vRiumQPJJVTKVDJDv.uFX27iSTvgNa	2025-10-29 00:41:02.269667
29	Gabriel Brandinoso	gabrielpereirabrandino@gmail.com	$2y$10$2HFWEPvIYl/zj.rsANou/.2Tc4Afndwk4v6wIZmwfiuN4.uvdhVHe	2025-10-29 00:46:56.982075
30	Diego Negresco	diegonegretto@gmail.com	$2y$10$bXN3heexoVeGLWtFP//qROhF52O5fhHEQ4IiPiguENhQbF8CAlstS	2025-10-29 00:53:52.222116
31	Eduardo Penaldo	edubennett@gmail.com	$2y$10$40wUo28t6fslRJ8vOasNbOLiGb/loYUhFgVtU6DA4CeTc0CffT9tS	2025-10-29 16:43:56.661536
33	Mateus Xamps	mateusxampp123@gmail.com	$2y$10$ECK.kU0fvjK/dl9qXLlmwu21lGBnZDNOjs9EOD0pqVQEO.kURffdK	2025-10-29 16:55:16.498707
34	Mateus Xamps	mateusxampp1223@gmail.com	$2y$10$5ha.bEewVw/exxocWdetyubmRiRJci33UwmRcvDIw1J7hcBbGLSB6	2025-10-29 16:56:37.770551
35	Joaquim Galileu	alisteu@gmail.com	$2y$10$o5yxw2haXABAhFMvl41EwOpf9VzrgHaV2zEMXUB0Keso6HmqL8UwG	2025-10-29 16:58:08.374164
36	Jean Pierre Polnaref	jotarokujo@gmail.com	$2y$10$gtrsFQUCG/guW0RSj6B/1uX9TLv2sDvtkdSmQFRQnYYg98Owc7L/m	2025-10-29 16:59:29.881756
37	Mateus Xampo	mateusxampo@gmail.com	$2y$10$UepRbClyC/ML4SrgmmDdgeWiqmGs8h8H7JZJkC7/DOuZSFiSzGf1K	2025-10-29 17:01:26.084043
38	Andre Mourinho	andmoura45@outlook.com	$2y$10$OKYO2t1Bbs1ykCkb0rYM2OdEj5wjUM/N4dRnNeBkkbZMUs9QwLjfS	2025-10-29 17:03:48.37452
39	Pedrinho Silva	pedrinhosilva@gmail.com	$2y$10$VGOgOEemeAD0EvasUcPouO0uvc.IzSTSmqYUXHGSDMP6E820KXH2O	2025-10-29 18:39:03.859365
40	Gil Silveirino	gilsilveirino@gmail.com	$2y$10$q7U8BlXdJcLR8ubZa5i8BeV/wMoOZZdm/33WQduPBTRoUBiTPb7SG	2025-10-29 18:46:26.399248
41	Joana Silveira	joanamedeiros@gmail.com	$2y$10$uDqDMie7P3yTL4Bpf8qUrO9a0QA07SUesZ0PTPuUiMObBWScNxzZa	2025-10-29 19:04:12.953103
42	Mateus Xamps	mateusdozedopicadinho@gmail.com	$2y$10$8O821meA5zBcvZcp7AVnNOW7aknLK8.O6iAcz01iaCzG2ddHFzP/O	2025-11-04 15:52:40.749037
44	Joaquim Gabriel	jowemep736@limtu.com	$2y$10$SSJrIYskrnDuRXWOZhkrD.xdahjzILOZ8NEg3pb8VdkkQ4E8vklXW	2025-11-04 16:30:09.499212
46	Gilberto Xande	eydwqnqsnikccgaubq@nesopf.com	$2y$10$FYI80/jz7rIEyj178P91vek32d9Chz/bD1PKPupSEHcg6oImUYWZC	2025-11-04 17:06:20.763303
47	Mateus Cuarente	yhufxwztbwadthuvap@nespf.com	$2y$10$o5I2p7SC.vFW80gu6kHSH.7aw/V/YvP2nC/vfm97g5rdHzXDDaMym	2025-11-04 17:18:14.993466
48	Joana Silva	loxoper807@wivstore.com	$2y$10$or0G8HLsqR6hc6En8A1R8uhUFUvt/McFG8yfVldmZMI9Dafweby36	2025-11-04 17:25:19.726109
49	William Clive	williamclive@gmail.com	$2y$10$c5BWyE66dGk0I7CBZVS6jejjoAkj4.o1c0wwfp3EWv7Hxf78A4A2O	2025-11-18 00:15:14.247663
50	Jean Core	izppbvgvdaanfveudy@nespj.com	$2y$10$VXi9iF75i7QBoINxHMA7kOvfuY9nA5cz2hHx4MqBIzJorGsb7kzCq	2025-11-18 00:16:57.519436
51	Flavio do Pneu	flavindopneu@gmail.com	$2y$10$mu0InjrcmrPAmHI369Ysr.ejxhhSxzBEzGoNujBwr7htbRTk9Lbqe	2025-11-18 00:47:23.416096
\.


                                                                         restore.sql                                                                                         0000600 0004000 0002000 00000031443 15107133404 0015367 0                                                                                                    ustar 00postgres                        postgres                        0000000 0000000                                                                                                                                                                        --
-- NOTE:
--
-- File paths need to be edited. Search for $$PATH$$ and
-- replace it with the path to the directory containing
-- the extracted data files.
--
--
-- PostgreSQL database dump
--

-- Dumped from database version 18.0
-- Dumped by pg_dump version 18.0

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

DROP DATABASE meusistema;
--
-- Name: meusistema; Type: DATABASE; Schema: -; Owner: postgres
--



ALTER DATABASE meusistema OWNER TO postgres;

\unrestrict (null)
\connect meusistema
\restrict (null)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: aparelhos; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.aparelhos (
    id bigint NOT NULL,
    residencia_id bigint NOT NULL,
    usuario_id integer NOT NULL,
    nome character varying(150) NOT NULL,
    potencia_watts integer NOT NULL,
    horas_uso double precision NOT NULL,
    data_criacao timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    comodo_id bigint,
    CONSTRAINT aparelhos_horas_uso_check CHECK (((horas_uso >= (0)::double precision) AND (horas_uso <= (24)::double precision))),
    CONSTRAINT aparelhos_potencia_watts_check CHECK ((potencia_watts > 0))
);


ALTER TABLE public.aparelhos OWNER TO postgres;

--
-- Name: aparelhos_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.aparelhos_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.aparelhos_id_seq OWNER TO postgres;

--
-- Name: aparelhos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.aparelhos_id_seq OWNED BY public.aparelhos.id;


--
-- Name: comodos; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.comodos (
    id bigint NOT NULL,
    residencia_id bigint NOT NULL,
    nome character varying(150) NOT NULL,
    imagem character varying(150),
    data_criacao timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.comodos OWNER TO postgres;

--
-- Name: comodos_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.comodos_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.comodos_id_seq OWNER TO postgres;

--
-- Name: comodos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.comodos_id_seq OWNED BY public.comodos.id;


--
-- Name: recuperacao_senha; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.recuperacao_senha (
    id integer NOT NULL,
    usuario_id integer NOT NULL,
    token character varying(64) NOT NULL,
    data_expiracao timestamp without time zone NOT NULL,
    usado boolean DEFAULT false,
    data_criacao timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.recuperacao_senha OWNER TO postgres;

--
-- Name: recuperacao_senha_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.recuperacao_senha_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.recuperacao_senha_id_seq OWNER TO postgres;

--
-- Name: recuperacao_senha_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.recuperacao_senha_id_seq OWNED BY public.recuperacao_senha.id;


--
-- Name: residencias; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.residencias (
    id bigint NOT NULL,
    usuario_id integer NOT NULL,
    nome character varying(150) NOT NULL,
    imagem character varying(150) NOT NULL,
    data_criacao timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    cidade character varying(100),
    tarifa_kwh numeric(10,2)
);


ALTER TABLE public.residencias OWNER TO postgres;

--
-- Name: residencias_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.residencias_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.residencias_id_seq OWNER TO postgres;

--
-- Name: residencias_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.residencias_id_seq OWNED BY public.residencias.id;


--
-- Name: usuarios; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.usuarios (
    id integer NOT NULL,
    nome character varying(100) NOT NULL,
    email character varying(100) NOT NULL,
    senha_hash character(60) NOT NULL,
    data_cadastro timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.usuarios OWNER TO postgres;

--
-- Name: usuarios_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.usuarios_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.usuarios_id_seq OWNER TO postgres;

--
-- Name: usuarios_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.usuarios_id_seq OWNED BY public.usuarios.id;


--
-- Name: aparelhos id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.aparelhos ALTER COLUMN id SET DEFAULT nextval('public.aparelhos_id_seq'::regclass);


--
-- Name: comodos id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.comodos ALTER COLUMN id SET DEFAULT nextval('public.comodos_id_seq'::regclass);


--
-- Name: recuperacao_senha id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.recuperacao_senha ALTER COLUMN id SET DEFAULT nextval('public.recuperacao_senha_id_seq'::regclass);


--
-- Name: residencias id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.residencias ALTER COLUMN id SET DEFAULT nextval('public.residencias_id_seq'::regclass);


--
-- Name: usuarios id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuarios ALTER COLUMN id SET DEFAULT nextval('public.usuarios_id_seq'::regclass);


--
-- Data for Name: aparelhos; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.aparelhos (id, residencia_id, usuario_id, nome, potencia_watts, horas_uso, data_criacao, comodo_id) FROM stdin;
\.
COPY public.aparelhos (id, residencia_id, usuario_id, nome, potencia_watts, horas_uso, data_criacao, comodo_id) FROM '$$PATH$$/5067.dat';

--
-- Data for Name: comodos; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.comodos (id, residencia_id, nome, imagem, data_criacao) FROM stdin;
\.
COPY public.comodos (id, residencia_id, nome, imagem, data_criacao) FROM '$$PATH$$/5071.dat';

--
-- Data for Name: recuperacao_senha; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.recuperacao_senha (id, usuario_id, token, data_expiracao, usado, data_criacao) FROM stdin;
\.
COPY public.recuperacao_senha (id, usuario_id, token, data_expiracao, usado, data_criacao) FROM '$$PATH$$/5069.dat';

--
-- Data for Name: residencias; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.residencias (id, usuario_id, nome, imagem, data_criacao, cidade, tarifa_kwh) FROM stdin;
\.
COPY public.residencias (id, usuario_id, nome, imagem, data_criacao, cidade, tarifa_kwh) FROM '$$PATH$$/5065.dat';

--
-- Data for Name: usuarios; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.usuarios (id, nome, email, senha_hash, data_cadastro) FROM stdin;
\.
COPY public.usuarios (id, nome, email, senha_hash, data_cadastro) FROM '$$PATH$$/5063.dat';

--
-- Name: aparelhos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.aparelhos_id_seq', 17, true);


--
-- Name: comodos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.comodos_id_seq', 25, true);


--
-- Name: recuperacao_senha_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.recuperacao_senha_id_seq', 13, true);


--
-- Name: residencias_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.residencias_id_seq', 8, true);


--
-- Name: usuarios_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.usuarios_id_seq', 51, true);


--
-- Name: aparelhos aparelhos_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.aparelhos
    ADD CONSTRAINT aparelhos_pkey PRIMARY KEY (id);


--
-- Name: comodos comodos_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.comodos
    ADD CONSTRAINT comodos_pkey PRIMARY KEY (id);


--
-- Name: recuperacao_senha recuperacao_senha_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.recuperacao_senha
    ADD CONSTRAINT recuperacao_senha_pkey PRIMARY KEY (id);


--
-- Name: recuperacao_senha recuperacao_senha_token_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.recuperacao_senha
    ADD CONSTRAINT recuperacao_senha_token_key UNIQUE (token);


--
-- Name: residencias residencias_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.residencias
    ADD CONSTRAINT residencias_pkey PRIMARY KEY (id);


--
-- Name: usuarios usuarios_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_email_key UNIQUE (email);


--
-- Name: usuarios usuarios_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_pkey PRIMARY KEY (id);


--
-- Name: idx_aparelhos_comodo; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_aparelhos_comodo ON public.aparelhos USING btree (comodo_id);


--
-- Name: idx_aparelhos_residencia; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_aparelhos_residencia ON public.aparelhos USING btree (residencia_id);


--
-- Name: idx_aparelhos_usuario; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_aparelhos_usuario ON public.aparelhos USING btree (usuario_id);


--
-- Name: idx_comodos_residencia; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_comodos_residencia ON public.comodos USING btree (residencia_id);


--
-- Name: idx_residencias_usuario; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_residencias_usuario ON public.residencias USING btree (usuario_id);


--
-- Name: uq_comodos_residencia_nome; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX uq_comodos_residencia_nome ON public.comodos USING btree (residencia_id, nome);


--
-- Name: aparelhos fk_aparelhos_comodo; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.aparelhos
    ADD CONSTRAINT fk_aparelhos_comodo FOREIGN KEY (comodo_id) REFERENCES public.comodos(id) ON DELETE SET NULL;


--
-- Name: aparelhos fk_aparelhos_residencia; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.aparelhos
    ADD CONSTRAINT fk_aparelhos_residencia FOREIGN KEY (residencia_id) REFERENCES public.residencias(id) ON DELETE CASCADE;


--
-- Name: aparelhos fk_aparelhos_usuario; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.aparelhos
    ADD CONSTRAINT fk_aparelhos_usuario FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id) ON DELETE CASCADE;


--
-- Name: comodos fk_comodos_residencia; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.comodos
    ADD CONSTRAINT fk_comodos_residencia FOREIGN KEY (residencia_id) REFERENCES public.residencias(id) ON DELETE CASCADE;


--
-- Name: residencias fk_residencia_usuario; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.residencias
    ADD CONSTRAINT fk_residencia_usuario FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id) ON DELETE CASCADE;


--
-- Name: recuperacao_senha recuperacao_senha_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.recuperacao_senha
    ADD CONSTRAINT recuperacao_senha_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id);


--
-- PostgreSQL database dump complete
--

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             