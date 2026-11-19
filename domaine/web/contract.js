// The estate's seasonal rental agreement, in French and in English (20 articles). Everything that
// changes from one stay to the next comes in through `v`, already escaped by the caller; nothing about
// the lessor is written here, it comes from the settings. The terms below (delays, penalties, hours)
// are the estate's current choices: they are kept in one place so that changing one changes both
// languages. The reasons for each clause are in the annotated version kept by the owners.
export const TERMS_FR = { far: 180, near: 60, mid: "50 %", holdDays: "sept jours", insDays: "quinze jours", extra: "50 €", outdoor: "23 h", stop: "3 h", noise: "500 €", tents: "six", tentPeople: "vingt", providers: "trente jours", carry: "18", keep: "cinq ans" };
export const TERMS_EN = { far: 180, near: 60, mid: "50%", holdDays: "seven days", insDays: "fifteen days", extra: "€50", outdoor: "11 PM", stop: "3 AM", noise: "€500", tents: "six", tentPeople: "twenty", providers: "thirty days", carry: "18", keep: "five years" };

const fr = (v, t = TERMS_FR) => `<h1>Contrat de location saisonnière</h1><p class="c">${v.brand}</p>
<h2>Article 1. Les parties</h2>
<p><b>Le bailleur</b> : ${v.lessor}, ${v.legal}, ${v.lessorAddress}, représentée par son gérant ${v.signer}. Téléphone : ${v.lessorPhone}. E-mail : ${v.lessorEmail}.</p>
<p><b>Le locataire</b> : ${v.tenants}. Adresse : ${v.address}. E-mail : ${v.email}. Téléphone : ${v.phone}.</p>
<p>Lorsqu'ils sont plusieurs, les locataires sont tenus solidairement et indivisiblement de toutes les obligations du présent contrat. Chacun peut être poursuivi pour le tout.</p>
<h2>Article 2. Objet</h2>
<p>Le bailleur donne en location saisonnière meublée, au locataire qui l'accepte, la propriété désignée à l'article 3, pour un séjour de vacances et, lorsque c'est indiqué ci-dessous, pour y recevoir un événement privé et familial.</p>
<p>Nature de la location : ${v.nature}.</p>
<p>Le présent contrat est un bail. Le bailleur n'organise pas l'événement et ne fournit aucune prestation de restauration, d'animation ou de coordination : ces prestations sont choisies, commandées et payées par le locataire auprès de professionnels de son choix. La propriété ne peut servir à aucun usage commercial sans accord écrit du bailleur.</p>
<h2>Article 3. Désignation du bien</h2>
<p>${v.place}. Meublé de tourisme enregistré sous le numéro ${v.regno}.</p>
<p>L'état descriptif des lieux figure en annexe 1 et l'inventaire du mobilier en annexe 2. Ils font partie du contrat.</p>
<p>Accueil téléphonique : du lundi au vendredi, 10 h à 12 h 30 et 14 h à 18 h ; le samedi, 10 h à 12 h 30. Téléphone : ${v.reception}.</p>
<h2>Article 4. Durée</h2>
<p>La location est consentie pour ${v.nights}, du ${v.start} à partir de ${v.arrival} au ${v.end} au plus tard à ${v.departure}. Ces horaires ne se modifient qu'avec l'accord écrit du bailleur. La location ne peut être ni prolongée ni cédée, et le bien ne peut être sous-loué.</p>
<h2>Article 5. Capacité</h2>
<p>Nombre maximal de personnes hébergées : ${v.occupants}. Nombre maximal de personnes présentes lors de l'événement, locataires compris : ${v.guests}.</p>
<p>Au-delà de ces nombres, le bailleur peut refuser l'accès aux personnes en surnombre, et le locataire doit une pénalité de ${t.extra} par personne et par jour. Lors des réceptions, seuls les locataires et les occupants des chambres accèdent à la partie habitation et en détiennent les clés. Les animaux sont acceptés avec l'accord écrit du bailleur.</p>
<h2>Article 6. Prix et paiement</h2>
<p>Le loyer est de ${v.amount} toutes taxes comprises pour la période. La taxe de séjour s'y ajoute, au tarif en vigueur : ${v.tax}.</p>
${v.split ? `<p>Le loyer se décompose ainsi : hébergement, ${v.stayPart} TTC (TVA à 10 %) ; mise à disposition des espaces de réception, ${v.eventPart} TTC (TVA à 20 %).</p>` : ""}
<p>Un acompte de ${v.pct}, soit ${v.deposit}, est versé à la signature par virement au bailleur. Les parties conviennent expressément que cette somme est un acompte et non des arrhes : dès son versement, le contrat engage définitivement le locataire comme le bailleur.</p>
<p>Le solde, soit ${v.balance}, est versé au plus tard le ${v.balanceDue}.</p>
<p>À défaut de paiement du solde à cette date, et huit jours après une mise en demeure envoyée par e-mail qui mentionne la présente clause et reste sans effet, le contrat est résolu de plein droit. L'article 7.1 s'applique alors comme si le locataire avait annulé à la date d'échéance du solde.</p>
<p>Le bailleur remet une note au locataire à chaque encaissement.</p>
<h2>Article 7. Annulation</h2>
<p><b>7.1 Annulation par le locataire.</b> Elle se fait par écrit, par e-mail. Le locataire doit alors :</p>
<ul><li>plus de ${t.far} jours avant l'arrivée : l'acompte, qui reste acquis au bailleur ;</li><li>entre ${t.far} et ${t.near} jours avant l'arrivée : ${t.mid} du loyer ;</li><li>moins de ${t.near} jours avant l'arrivée : la totalité du loyer.</li></ul>
<p>Si le bailleur parvient à relouer le bien pour tout ou partie de la même période, il restitue au locataire les sommes perçues au-delà de l'acompte, dans la limite du loyer encaissé du nouveau locataire.</p>
<p><b>7.2 Annulation par le bailleur.</b> Si le bailleur annule la location pour une raison autre que celles des articles 7.3 et 15, il restitue sous quatorze jours toutes les sommes versées et verse au locataire une indemnité égale au montant de l'acompte.</p>
<p><b>7.3 Impossibilité tenant au bien.</b> Si le bien est détruit, sinistré ou frappé d'une interdiction administrative qui empêche la location, le contrat prend fin de plein droit. Le bailleur restitue toutes les sommes versées, sans autre indemnité, et propose un report lorsque c'est possible.</p>
<p><b>7.4 Empêchement personnel du locataire.</b> Un événement qui touche le locataire ou ses invités (changement de projet, séparation, maladie, difficulté de déplacement, refus de visa) n'empêche pas le paiement du loyer et relève de l'article 7.1. Toutefois, en cas de décès ou d'hospitalisation de l'un des locataires, justifiés par un certificat, le bailleur propose un report sans frais dans les ${t.carry} mois.</p>
<p><b>7.5 Reports.</b> En cas d'interdiction de rassemblement ou de déplacement décidée par les autorités, ou de grossesse signalée au moins trois mois avant l'arrivée, le locataire peut reporter son séjour sans frais, selon le planning disponible.</p>
<p><b>7.6 Assurance annulation.</b> Le bailleur recommande au locataire de souscrire une assurance annulation.</p>
<h2>Article 8. Dépôt de garantie et états des lieux</h2>
<p>Le locataire verse un dépôt de garantie de ${v.hold} au plus tard ${t.holdDays} avant l'arrivée, par virement, par chèque ou par empreinte de carte bancaire.</p>
<p>Un état des lieux contradictoire est établi et signé à l'arrivée et au départ. Si le locataire ne se présente pas à l'état des lieux de départ, celui que le bailleur établit dans les quarante-huit heures, photographies à l'appui, fait foi sauf preuve contraire.</p>
<p>Le dépôt est restitué dans les quinze jours du départ, déduction faite des sommes justifiées par factures, devis ou photographies : objets remplacés, remises en état, ménage au-delà de l'usage normal, pénalités prévues au contrat.</p>
<p>Le dépôt de garantie n'est pas un plafond. Le locataire répond de toutes les dégradations et pertes survenues pendant la location, de son fait, de celui de ses invités et de celui de ses prestataires, et règle la part qui dépasse le dépôt dans les quinze jours de la demande justifiée.</p>
<h2>Article 9. Assurance</h2>
<p>Le locataire est assuré en responsabilité civile pour la location saisonnière et pour l'événement qu'il organise : vol, incendie, dégât des eaux, bris de glace, risques locatifs et recours des voisins. Il remet l'attestation au bailleur au plus tard ${t.insDays} avant l'arrivée. Elle couvre toute la durée du séjour et mentionne l'adresse du bien.</p>
<p>Le locataire est informé que l'assureur du bailleur peut exercer un recours contre lui en cas de sinistre dont il répond.</p>
<h2>Article 10. Responsabilités</h2>
<p>Le bailleur délivre un bien conforme à l'état descriptif, en bon état d'usage et de sécurité, et répond de ses obligations légales.</p>
<p>Le locataire a la garde des lieux, du mobilier et des équipements pendant toute la location. Il répond des dommages causés par lui-même, par ses invités et par ses prestataires, et signale sans délai tout sinistre au bailleur. Les taches et dégradations qui imposent le remplacement d'un linge, d'un textile ou d'un meuble sont à sa charge.</p>
<p><b>Piscine.</b> La piscine n'est pas surveillée. Elle est équipée d'un dispositif de sécurité conforme (alarme et barrières) que le locataire s'engage à laisser en service en permanence. Les enfants et les personnes qui ne savent pas nager restent sous la surveillance constante d'un adulte désigné par le locataire. Les chiens n'y sont pas admis. Le locataire répond des conséquences de la neutralisation du dispositif de sécurité par lui-même ou par ses invités.</p>
<h2>Article 11. Séjour</h2>
<p><b>Décorations.</b> Elles sont autorisées dans le respect des lieux et retirées sans laisser de trace à la fin de la location.</p>
<p><b>Tentes.</b> Les tentes de réception se montent dans la zone indiquée par le bailleur, avec son accord écrit sur l'emplacement. Les tentes d'hébergement sont installées uniquement par le prestataire agréé par le bailleur, dans la limite de ${t.tents} tentes et de ${t.tentPeople} personnes, comprises dans la capacité de l'article 5.</p>
<p><b>Sécurité incendie.</b> Feux d'artifice, lanternes célestes, fumigènes et feux de Bengale sont interdits. Les photophores en verre sont interdits autour de la piscine. Les bougies sont admises dans la maison et sur la terrasse, sous surveillance. Il est interdit de fumer à l'intérieur ; des cendriers sont fournis à l'extérieur.</p>
<h2>Article 12. Bruit et musique</h2>
<p>Le locataire respecte la tranquillité du voisinage. La musique amplifiée est autorisée en extérieur jusqu'à ${t.outdoor}. Au-delà, elle se poursuit uniquement à l'intérieur, portes fermées, et s'arrête à ${t.stop}. Lorsque le bailleur fournit un limiteur de niveau sonore, le matériel de sonorisation y est obligatoirement raccordé.</p>
<p>Le bailleur ou son représentant peut faire baisser ou arrêter la musique en cas de dépassement. Chaque manquement constaté par le bailleur, son représentant ou les forces de l'ordre donne lieu à une pénalité de ${t.noise}. Le locataire garantit en outre le bailleur de toute amende, condamnation ou indemnité mise à sa charge du fait du bruit de l'événement.</p>
<h2>Article 13. Prestataires</h2>
<p>Le locataire communique au bailleur, au plus tard ${t.providers} avant l'arrivée, la liste de ses prestataires (traiteur, musique, tentes, décoration, mobilier) et leurs horaires d'intervention. Chacun est assuré en responsabilité civile professionnelle et en justifie sur demande. Le locataire répond envers le bailleur des dommages qu'ils causent.</p>
<p>Le bailleur n'impose aucun prestataire. Il peut en recommander ; il informe alors le locataire que certains lui versent une commission.</p>
<h2>Article 14. Entrée et sortie</h2>
<p>Le locataire contacte le bailleur quarante-huit heures avant l'arrivée pour convenir de la remise des clés. Les clés ne sont remises que si le bailleur a reçu : le contrat signé par chaque locataire, le paiement intégral du loyer, le dépôt de garantie et l'attestation d'assurance. L'état des lieux d'entrée est signé à la remise des clés.</p>
<p>Au départ, un horaire est convenu pour l'état des lieux de sortie et pour l'enlèvement du matériel des prestataires, qui doit être terminé à l'heure de départ de l'article 4.</p>
<h2>Article 15. Résiliation pour manquement</h2>
<p>Le contrat est résolu de plein droit, huit jours après une mise en demeure par e-mail mentionnant la présente clause et restée sans effet, en cas de : défaut de paiement d'une somme due ; dépassement de la capacité de l'article 5 ; déclaration inexacte sur la nature ou l'ampleur de l'événement ; violation d'une interdiction de sécurité de l'article 11. En cas de danger pour les personnes ou pour les lieux, le bailleur peut faire cesser l'activité en cause immédiatement.</p>
<p>Les sommes versées restent alors acquises au bailleur dans les conditions de l'article 7.1, et le locataire libère les lieux. À défaut, son expulsion peut être ordonnée en référé.</p>
<h2>Article 16. Modifications du contrat</h2>
<p>Le contrat ne se modifie que par un avenant écrit, signé par le gérant du bailleur et par le locataire. Aucune remise, dérogation ou promesse de remboursement faite oralement ou par message par un collaborateur ou un prestataire du bailleur n'engage celui-ci tant qu'elle n'est pas confirmée par un tel avenant.</p>
<h2>Article 17. Données personnelles</h2>
<p>Le bailleur recueille l'identité et les coordonnées du locataire pour conclure et exécuter le contrat, et les conserve ${t.keep} après le séjour. Pour les locataires de nationalité étrangère, la fiche de police prévue par la réglementation est remplie à l'arrivée et conservée six mois. Ces données ne sont transmises qu'aux prestataires du bailleur qui en ont besoin et aux autorités qui le demandent. Le locataire peut y accéder, les faire rectifier ou effacer en écrivant à ${v.lessorEmail}.</p>
<h2>Article 18. Absence de droit de rétractation</h2>
<p>Le locataire est informé qu'il ne bénéficie pas d'un droit de rétractation : le contrat porte sur un hébergement fourni à une période déterminée (Code de la consommation, article L221-28, 12°).</p>
<h2>Article 19. Médiation</h2>
<p>En cas de litige non résolu avec le bailleur, le locataire peut saisir gratuitement le médiateur de la consommation dont relève le bailleur : ${v.mediator}.</p>
<h2>Article 20. Droit applicable, langue et litiges</h2>
<p>Le contrat est soumis au droit français. Tout litige relève des juridictions françaises du lieu de situation de l'immeuble. Lorsque le contrat est établi en deux langues, la version française fait foi.</p>
<h2>Signatures</h2>
<p>Fait en autant d'exemplaires que de parties, chacune reconnaissant avoir reçu le sien, ou signé par voie électronique. Le locataire reconnaît avoir reçu l'état descriptif (annexe 1) et l'inventaire (annexe 2).</p>
<p>À ${v.city}, le ....................</p>
<table><tr><td>Le locataire<br><i>Nom, prénom, signature</i><br><br><br></td><td>Le locataire<br><i>Nom, prénom, signature</i><br><br><br></td></tr><tr><td>Pour le bailleur, son gérant : ${v.signer}<br><i>Signature</i><br><br><br></td><td></td></tr></table>`;

const en = (v, t = TERMS_EN) => `<h1>Seasonal Rental Agreement</h1><p class="c">${v.brand}</p>
<h2>Article 1. The parties</h2>
<p><b>The lessor</b>: ${v.lessor}, ${v.legal}, ${v.lessorAddress}, represented by its manager ${v.signer}. Phone: ${v.lessorPhone}. Email: ${v.lessorEmail}.</p>
<p><b>The tenant</b>: ${v.tenants}. Address: ${v.address}. Email: ${v.email}. Phone: ${v.phone}.</p>
<p>Where there are several tenants, they are jointly and severally liable for all obligations under this agreement. Each of them may be pursued for the whole.</p>
<h2>Article 2. Purpose</h2>
<p>The lessor lets to the tenant, who accepts, as a furnished seasonal rental, the property described in article 3, for a holiday stay and, where stated below, to host a private family event.</p>
<p>Nature of the rental: ${v.nature}.</p>
<p>This agreement is a lease. The lessor does not organise the event and provides no catering, entertainment or coordination service: these are chosen, ordered and paid for by the tenant from professionals of the tenant's choice. The property may not be used for any commercial purpose without the lessor's written consent.</p>
<h2>Article 3. The property</h2>
<p>${v.place}. Furnished tourist accommodation registered under number ${v.regno}.</p>
<p>The description of the premises is in appendix 1 and the inventory of furniture in appendix 2. Both form part of this agreement.</p>
<p>Reception by phone: Monday to Friday, 10 AM to 12:30 PM and 2 PM to 6 PM; Saturday, 10 AM to 12:30 PM. Phone: ${v.reception}.</p>
<h2>Article 4. Rental period</h2>
<p>The rental is granted for ${v.nights}, from ${v.start} from ${v.arrival} to ${v.end} no later than ${v.departure}. These times may only be changed with the lessor's written consent. The rental may not be extended or assigned, and the property may not be sublet.</p>
<h2>Article 5. Capacity</h2>
<p>Maximum number of people staying overnight: ${v.occupants}. Maximum number of people present during the event, tenants included: ${v.guests}.</p>
<p>Beyond these numbers, the lessor may refuse access to the additional people, and the tenant owes a penalty of ${t.extra} per person per day. During receptions, only the tenants and the occupants of the bedrooms may enter the living quarters and hold the keys. Pets are accepted with the lessor's written consent.</p>
<h2>Article 6. Price and payment</h2>
<p>The rent is ${v.amount} including all taxes for the period. Tourist tax is added at the rate in force: ${v.tax}.</p>
${v.split ? `<p>The rent breaks down as follows: accommodation, ${v.stayPart} including tax (VAT at 10%); use of the reception areas, ${v.eventPart} including tax (VAT at 20%).</p>` : ""}
<p>A down payment of ${v.pct}, that is ${v.deposit}, is paid on signature by bank transfer to the lessor. The parties expressly agree that this sum is a down payment ("acompte") and not a forfeitable deposit ("arrhes"): once it is paid, the agreement is final and binding on both the tenant and the lessor.</p>
<p>The balance, that is ${v.balance}, is paid no later than ${v.balanceDue}.</p>
<p>If the balance is not paid by that date, and eight days after a formal notice sent by email that refers to this clause has remained without effect, the agreement is terminated automatically. Article 7.1 then applies as if the tenant had cancelled on the date the balance fell due.</p>
<p>The lessor gives the tenant a receipt for each payment.</p>
<h2>Article 7. Cancellation</h2>
<p><b>7.1 Cancellation by the tenant.</b> It is made in writing, by email. The tenant then owes:</p>
<ul><li>more than ${t.far} days before arrival: the down payment, which the lessor keeps;</li><li>between ${t.far} and ${t.near} days before arrival: ${t.mid} of the rent;</li><li>less than ${t.near} days before arrival: the full rent.</li></ul>
<p>If the lessor manages to re-let the property for all or part of the same period, it refunds to the tenant the sums received beyond the down payment, up to the rent collected from the new tenant.</p>
<p><b>7.2 Cancellation by the lessor.</b> If the lessor cancels the rental for a reason other than those of articles 7.3 and 15, it refunds all sums paid within fourteen days and pays the tenant compensation equal to the down payment.</p>
<p><b>7.3 Impossibility relating to the property.</b> If the property is destroyed, damaged or subject to an administrative ban that prevents the rental, the agreement ends automatically. The lessor refunds all sums paid, without further compensation, and offers a postponement where possible.</p>
<p><b>7.4 Personal impediment of the tenant.</b> An event affecting the tenant or the tenant's guests (change of plans, separation, illness, travel difficulty, visa refusal) does not prevent payment of the rent and falls under article 7.1. However, in the event of the death or hospitalisation of one of the tenants, evidenced by a certificate, the lessor offers a postponement free of charge within ${t.carry} months.</p>
<p><b>7.5 Postponements.</b> In the event of a ban on gatherings or travel decided by the authorities, or of a pregnancy notified at least three months before arrival, the tenant may postpone the stay free of charge, subject to availability.</p>
<p><b>7.6 Cancellation insurance.</b> The lessor recommends that the tenant take out cancellation insurance.</p>
<h2>Article 8. Security deposit and inventories</h2>
<p>The tenant pays a security deposit of ${v.hold} no later than ${t.holdDays} before arrival, by bank transfer, cheque or bank card imprint.</p>
<p>A joint inventory of the premises is drawn up and signed on arrival and on departure. If the tenant does not attend the departure inventory, the one drawn up by the lessor within forty-eight hours, supported by photographs, stands unless proven otherwise.</p>
<p>The deposit is returned within fifteen days of departure, after deduction of sums evidenced by invoices, quotes or photographs: items replaced, repairs, cleaning beyond normal use, penalties provided for in this agreement.</p>
<p>The security deposit is not a cap. The tenant is liable for all damage and losses occurring during the rental, caused by the tenant, the tenant's guests or the tenant's service providers, and pays any amount exceeding the deposit within fifteen days of the evidenced request.</p>
<h2>Article 9. Insurance</h2>
<p>The tenant holds civil liability insurance for the seasonal rental and for the event organised: theft, fire, water damage, broken glass, rental risks and claims from neighbours. The tenant sends the certificate to the lessor no later than ${t.insDays} before arrival. It covers the whole stay and states the address of the property.</p>
<p>The tenant is informed that the lessor's insurer may bring a claim against the tenant for any loss the tenant is liable for.</p>
<h2>Article 10. Liability</h2>
<p>The lessor delivers a property that matches its description, in good and safe condition, and is answerable for its legal obligations.</p>
<p>The tenant has custody of the premises, furniture and equipment throughout the rental. The tenant is liable for damage caused by the tenant, guests and service providers, and reports any incident to the lessor without delay. Stains and damage requiring the replacement of linen, a textile or a piece of furniture are charged to the tenant.</p>
<p><b>Pool.</b> The pool is not supervised. It is fitted with a compliant safety device (alarm and barriers) which the tenant undertakes to keep in operation at all times. Children and non-swimmers remain under the constant supervision of an adult designated by the tenant. Dogs are not allowed in the pool. The tenant is liable for the consequences of the safety device being disabled by the tenant or by guests.</p>
<h2>Article 11. During the stay</h2>
<p><b>Decorations.</b> They are allowed, with respect for the premises, and removed without a trace at the end of the rental.</p>
<p><b>Tents.</b> Reception tents are put up in the area indicated by the lessor, with its written consent on the location. Accommodation tents are installed only by the provider approved by the lessor, up to ${t.tents} tents and ${t.tentPeople} people, included in the capacity of article 5.</p>
<p><b>Fire safety.</b> Fireworks, sky lanterns, smoke bombs and Bengal lights are forbidden. Glass tealight holders are forbidden around the pool. Candles are allowed in the house and on the terrace, under supervision. Smoking is forbidden indoors; ashtrays are provided outside.</p>
<h2>Article 12. Noise and music</h2>
<p>The tenant respects the peace of the neighbourhood. Amplified music is allowed outdoors until ${t.outdoor}. After that it continues indoors only, doors closed, and stops at ${t.stop}. Where the lessor provides a sound limiter, the sound equipment must be connected to it.</p>
<p>The lessor or its representative may have the music turned down or stopped if these limits are exceeded. Each breach recorded by the lessor, its representative or the police gives rise to a penalty of ${t.noise}. The tenant also indemnifies the lessor against any fine, judgment or compensation it has to bear because of the noise of the event.</p>
<h2>Article 13. Service providers</h2>
<p>No later than ${t.providers} before arrival, the tenant sends the lessor the list of service providers (caterer, music, tents, decoration, furniture) and their working hours. Each holds professional liability insurance and proves it on request. The tenant is liable to the lessor for any damage they cause.</p>
<p>The lessor imposes no provider. It may recommend some; it then informs the tenant that some of them pay it a commission.</p>
<h2>Article 14. Arrival and departure</h2>
<p>The tenant contacts the lessor forty-eight hours before arrival to arrange the handover of keys. Keys are handed over only once the lessor has received: the agreement signed by each tenant, full payment of the rent, the security deposit and the insurance certificate. The arrival inventory is signed when the keys are handed over.</p>
<p>On departure, a time is agreed for the departure inventory and for the removal of the providers' equipment, which must be completed by the departure time of article 4.</p>
<h2>Article 15. Termination for breach</h2>
<p>The agreement is terminated automatically, eight days after a formal notice by email referring to this clause has remained without effect, in the event of: failure to pay a sum due; exceeding the capacity of article 5; an inaccurate statement about the nature or size of the event; breach of a safety prohibition of article 11. Where there is a danger to people or to the premises, the lessor may have the activity concerned stopped immediately.</p>
<p>The sums paid are then kept by the lessor under the conditions of article 7.1, and the tenant vacates the premises. Failing that, eviction may be ordered by the court in summary proceedings.</p>
<h2>Article 16. Changes to the agreement</h2>
<p>The agreement may only be changed by a written amendment signed by the lessor's manager and by the tenant. No discount, exception or promise of refund made orally or by message by a member of staff or a service provider of the lessor binds the lessor unless confirmed by such an amendment.</p>
<h2>Article 17. Personal data</h2>
<p>The lessor collects the tenant's identity and contact details to conclude and perform the agreement, and keeps them for ${t.keep} after the stay. For tenants of foreign nationality, the police form required by regulation is filled in on arrival and kept for six months. These data are passed only to the lessor's providers who need them and to authorities who request them. The tenant may access, correct or erase them by writing to ${v.lessorEmail}.</p>
<h2>Article 18. No right of withdrawal</h2>
<p>The tenant is informed that there is no right of withdrawal: the agreement concerns accommodation provided for a specific period (French Consumer Code, article L221-28, 12°).</p>
<h2>Article 19. Mediation</h2>
<p>In the event of a dispute not resolved with the lessor, the tenant may refer it free of charge to the consumer mediator the lessor belongs to: ${v.mediator}.</p>
<h2>Article 20. Governing law, language and disputes</h2>
<p>The agreement is governed by French law. Any dispute falls within the jurisdiction of the French courts of the place where the property is located. Where the agreement is drawn up in two languages, the French version prevails.</p>
<h2>Signatures</h2>
<p>Made in as many originals as there are parties, each acknowledging receipt of its own, or signed electronically. The tenant acknowledges having received the description of the premises (appendix 1) and the inventory (appendix 2).</p>
<p>In ${v.city}, on ....................</p>
<table><tr><td>The tenant<br><i>Full name, signature</i><br><br><br></td><td>The tenant<br><i>Full name, signature</i><br><br><br></td></tr><tr><td>For the lessor, its manager: ${v.signer}<br><i>Signature</i><br><br><br></td><td></td></tr></table>`;

export const CONTRACT = { fr, en };
